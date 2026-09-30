# frozen_string_literal: true

require "rails_helper"

RSpec.describe WatchlistItem do
  it "upcases and strips the symbol" do
    item = build(:watchlist_item, symbol: "  aapl ")
    item.validate

    expect(item.symbol).to eq("AAPL")
  end

  it "rejects duplicate symbols per user (case-insensitive)" do
    user = create(:user)
    create(:watchlist_item, user: user, symbol: "AAPL")
    duplicate = build(:watchlist_item, user: user, symbol: "aapl")

    expect(duplicate).not_to be_valid
  end

  it "rejects symbols with invalid characters" do
    expect(build(:watchlist_item, symbol: "AA PL")).not_to be_valid
  end

  it "exposes an inertia payload" do
    item = create(:watchlist_item, symbol: "MSFT", name: "Microsoft")

    expect(item.as_json_payload).to include(symbol: "MSFT", name: "Microsoft")
  end
end
