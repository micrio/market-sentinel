# frozen_string_literal: true

require "rails_helper"

RSpec.describe FinnhubQuote do
  subject(:service) { described_class.new("AAPL", api_key: "test-key") }

  it "maps a Finnhub quote into a StockQuote::Result" do
    allow(service).to receive(:get_json)
      .with("/quote", symbol: "AAPL")
      .and_return({ "c" => 200.5, "d" => 2.5, "dp" => 1.26, "pc" => 198.0 })
    allow(service).to receive(:get_json)
      .with("/stock/profile2", symbol: "AAPL")
      .and_return({ "name" => "Apple Inc.", "currency" => "USD" })

    result = service.fetch

    expect(result.symbol).to eq("AAPL")
    expect(result.name).to eq("Apple Inc.")
    expect(result.price).to eq(200.5)
    expect(result.previous_close).to eq(198.0)
    expect(result.change).to eq(2.5)
    expect(result.change_percent).to eq(1.26)
    expect(result.currency).to eq("USD")
  end

  it "computes change from previous close when Finnhub omits it" do
    allow(service).to receive(:get_json)
      .with("/quote", symbol: "AAPL")
      .and_return({ "c" => 110.0, "pc" => 100.0 })
    allow(service).to receive(:get_json).with("/stock/profile2", symbol: "AAPL").and_return({})

    result = service.fetch

    expect(result.change).to eq(10.0)
    expect(result.change_percent).to eq(10.0)
    expect(result.name).to eq("AAPL")
    expect(result.currency).to eq("USD")
  end

  it "returns nil without an API key" do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("FINNHUB_API_KEY").and_return(nil)

    expect(described_class.new("AAPL").fetch).to be_nil
  end

  it "returns nil when the quote request fails" do
    allow(service).to receive(:get_json).and_return(nil)

    expect(service.fetch).to be_nil
  end

  it "returns nil when the price is zero" do
    allow(service).to receive(:get_json).and_return({ "c" => 0 })

    expect(service.fetch).to be_nil
  end

  it "returns nil for a blank symbol" do
    expect(described_class.new("", api_key: "test-key").fetch).to be_nil
  end
end
