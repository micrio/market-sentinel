# frozen_string_literal: true

require "net/http"
require "json"
require "cgi"

# Fetches a live-ish quote from Yahoo Finance's public chart endpoint.
# No API key required; returns nil on any failure so callers can degrade.
class StockQuote
  BASE = "https://query1.finance.yahoo.com/v8/finance/chart"
  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
               "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"

  Result = Struct.new(
    :symbol, :name, :price, :previous_close, :change, :change_percent, :currency,
    keyword_init: true
  )

  def initialize(symbol, timeout: 8)
    @symbol = symbol.to_s.strip.upcase
    @timeout = timeout
  end

  def fetch
    return nil if @symbol.blank?

    meta = fetch_meta
    return nil if meta.nil?

    price = meta["regularMarketPrice"].to_f
    previous = (meta["chartPreviousClose"] || meta["previousClose"]).to_f
    previous = price if previous.zero?
    change = price - previous
    percent = previous.zero? ? 0.0 : (change / previous) * 100

    Result.new(
      symbol: @symbol,
      name: meta["longName"] || meta["shortName"],
      price: price.round(2),
      previous_close: previous.round(2),
      change: change.round(2),
      change_percent: percent.round(2),
      currency: meta["currency"]
    )
  rescue StandardError => e
    Rails.logger.warn("[StockQuote] #{@symbol}: #{e.class}: #{e.message}")
    nil
  end

  private

  def fetch_meta
    uri = URI("#{BASE}/#{CGI.escape(@symbol)}?range=5d&interval=1d")
    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT
    request["Accept"] = "application/json"

    response = Net::HTTP.start(
      uri.host, uri.port,
      use_ssl: true,
      open_timeout: @timeout,
      read_timeout: @timeout
    ) { |http| http.request(request) }

    return nil unless response.is_a?(Net::HTTPSuccess)

    body = JSON.parse(response.body)
    body.dig("chart", "result", 0, "meta")
  rescue StandardError => e
    Rails.logger.warn("[StockQuote] #{@symbol}: #{e.class}: #{e.message}")
    nil
  end
end
