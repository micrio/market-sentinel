# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Quotes", type: :request do
  before { sign_in create(:user) }

  it "returns serialized quotes for the requested symbols" do
    result = StockQuote::Result.new(
      symbol: "AAPL", name: "Apple Inc.", price: 200.5, previous_close: 198.0,
      change: 2.5, change_percent: 1.26, currency: "USD"
    )
    allow(StockQuote).to receive(:new).with("AAPL").and_return(double(fetch: result))

    get quotes_path(symbols: "aapl")

    quotes = response.parsed_body["quotes"]
    expect(quotes.size).to eq(1)
    expect(quotes.first).to include("symbol" => "AAPL", "price" => 200.5, "changePercent" => 1.26)
  end

  it "skips symbols that fail to quote" do
    allow(StockQuote).to receive(:new).and_return(double(fetch: nil))
    allow(FinnhubQuote).to receive(:new).and_return(double(fetch: nil))

    get quotes_path(symbols: "AAPL,TSLA")

    expect(response.parsed_body["quotes"]).to eq([])
  end

  it "falls back to Finnhub when Yahoo fails" do
    allow(StockQuote).to receive(:new).with("AAPL").and_return(double(fetch: nil))
    result = StockQuote::Result.new(
      symbol: "AAPL", name: "Apple Inc.", price: 200.5, previous_close: 198.0,
      change: 2.5, change_percent: 1.26, currency: "USD"
    )
    allow(FinnhubQuote).to receive(:new).with("AAPL").and_return(double(fetch: result))

    get quotes_path(symbols: "AAPL")

    expect(response.parsed_body["quotes"].first).to include("symbol" => "AAPL", "price" => 200.5)
  end
end
