# frozen_string_literal: true

require "rails_helper"

RSpec.describe NewsCrawler do
  let(:rss) do
    <<~XML
      <?xml version="1.0"?>
      <rss version="2.0"><channel>
        <item>
          <title>Apple beats earnings</title>
          <link>https://news.test/apple-beats</link>
          <pubDate>Mon, 01 Jan 2026 10:00:00 GMT</pubDate>
          <description><![CDATA[<p>Apple <b>surged</b> today.</p>]]></description>
        </item>
        <item>
          <title>Apple forecast</title>
          <link>https://news.test/apple-forecast</link>
          <pubDate>Tue, 02 Jan 2026 10:00:00 GMT</pubDate>
          <description>Outlook is stable.</description>
        </item>
      </channel></rss>
    XML
  end

  it "parses RSS items into articles, newest first" do
    crawler = described_class.new("AAPL")
    allow(crawler).to receive(:get).and_return(rss)

    articles = crawler.call

    expect(articles.map(&:title)).to eq([ "Apple forecast", "Apple beats earnings" ])
    expect(articles.first.url).to eq("https://news.test/apple-forecast")
    expect(articles.last.snippet).to include("surged")
  end

  it "returns an empty array when the feed fails" do
    crawler = described_class.new("AAPL")
    allow(crawler).to receive(:get).and_return(nil)

    expect(crawler.call).to eq([])
  end
end
