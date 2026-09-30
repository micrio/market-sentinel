# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WatchlistItems", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "POST /watchlist_items" do
    it "adds a normalized ticker" do
      expect do
        post watchlist_items_path, params: { symbol: "aapl" }
      end.to change(user.watchlist_items, :count).by(1)

      expect(user.watchlist_items.last.symbol).to eq("AAPL")
    end

    it "rejects an invalid ticker" do
      post watchlist_items_path, params: { symbol: "not a ticker!" }

      expect(user.watchlist_items.count).to eq(0)
      expect(response).to redirect_to(root_path)
    end
  end

  describe "DELETE /watchlist_items/:id" do
    it "removes the ticker" do
      item = create(:watchlist_item, user: user, symbol: "TSLA")

      expect do
        delete watchlist_item_path(item)
      end.to change(user.watchlist_items, :count).by(-1)
    end
  end
end
