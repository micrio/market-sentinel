# frozen_string_literal: true

require "net/http"
require "json"
require "cgi"
require "time"

# Crawls recent financial headlines for a ticker from public RSS feeds
# (Yahoo Finance + Google News). Robust: any failing source is skipped.
class NewsCrawler
  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
               "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"

  Article = Struct.new(:title, :url, :source, :published_at, :snippet, keyword_init: true)

  FEEDS = [
    { source: "Yahoo Finance", url: "https://finance.yahoo.com/rss/headline?s=%<symbol>s" },
    {
      source: "Google News",
      url: "https://news.google.com/rss/search?q=%<symbol>s+stock&hl=en-US&gl=US&ceid=US:en"
    }
  ].freeze

  def initialize(symbol, timeout: 10, limit: 10)
    @symbol = symbol.to_s.strip.upcase
    @timeout = timeout
    @limit = limit
  end

  def call
    articles = FEEDS.flat_map { |feed| fetch_feed(feed[:source], feed[:url] % { symbol: CGI.escape(@symbol) }) }
    articles
      .uniq { |article| article.url }
      .sort_by { |article| article.published_at || Time.at(0) }
      .reverse
      .first(@limit)
  end

  private

  def fetch_feed(source, url)
    body = get(url)
    return [] if body.blank?

    doc = Nokogiri::XML(body)
    doc.remove_namespaces!
    doc.xpath("//item").filter_map { |item| parse_item(item, source) }
  rescue StandardError => e
    Rails.logger.warn("[NewsCrawler] #{source}: #{e.class}: #{e.message}")
    []
  end

  def parse_item(item, source)
    title = item.at_xpath("title")&.text.to_s.strip
    link = item.at_xpath("link")&.text.to_s.strip
    link = item.at_xpath("guid")&.text.to_s.strip if link.blank?
    return nil if title.blank? || link.blank?

    Article.new(
      title: title,
      url: link,
      source: source,
      published_at: parse_time(item.at_xpath("pubDate")&.text),
      snippet: clean_snippet(item.at_xpath("description")&.text)
    )
  end

  def parse_time(value)
    return nil if value.blank?

    Time.parse(value)
  rescue ArgumentError
    nil
  end

  def clean_snippet(html)
    return nil if html.blank?

    text = Nokogiri::HTML(html).text
    text.gsub(/\s+/, " ").strip.first(400).presence
  end

  def get(url)
    uri = URI(url)
    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT
    request["Accept"] = "application/rss+xml, application/xml, text/xml"

    response = Net::HTTP.start(
      uri.host, uri.port,
      use_ssl: uri.scheme == "https",
      open_timeout: @timeout,
      read_timeout: @timeout
    ) { |http| http.request(request) }

    return nil unless response.is_a?(Net::HTTPSuccess)

    response.body
  end
end
