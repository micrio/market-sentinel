# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuoteLookup do
  include ActiveSupport::Testing::TimeHelpers

  let(:store) { ActiveSupport::Cache::MemoryStore.new }
  let(:result) do
    StockQuote::Result.new(
      symbol: "AAPL", name: "Apple Inc.", price: 200.5, previous_close: 198.0,
      change: 2.5, change_percent: 1.26, currency: "USD"
    )
  end

  before { allow(Rails).to receive(:cache).and_return(store) }

  it "fetches once and serves the cached quote with its original timestamp" do
    expect(StockQuote).to receive(:new).once.and_return(double(fetch: result))

    first = described_class.call("aapl")
    second = described_class.call("aapl")

    expect(first.updated_at).to be_present
    expect(second.updated_at).to eq(first.updated_at)
  end

  it "refetches only after the cached entry expires" do
    expect(StockQuote).to receive(:new).twice.and_return(double(fetch: result))

    described_class.call("AAPL")
    travel(31.minutes) { described_class.call("AAPL") }
  end

  it "falls back to Finnhub when Yahoo fails" do
    allow(StockQuote).to receive(:new).and_return(double(fetch: nil))
    allow(FinnhubQuote).to receive(:new).with("AAPL").and_return(double(fetch: result))

    expect(described_class.call("AAPL")).to eq(result)
  end

  it "does not cache a total failure" do
    allow(StockQuote).to receive(:new).and_return(double(fetch: nil))
    allow(FinnhubQuote).to receive(:new).and_return(double(fetch: nil))

    expect(described_class.call("AAPL")).to be_nil
    expect(store.read("quote/AAPL")).to be_nil
  end

  it "returns nil for a blank symbol without touching the cache" do
    expect(Rails.cache).not_to receive(:read)

    expect(described_class.call("")).to be_nil
  end
end
