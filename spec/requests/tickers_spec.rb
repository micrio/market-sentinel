# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Tickers", type: :request do
  it "requires authentication" do
    get ticker_path("AAPL")

    expect(response).to redirect_to(new_user_session_path)
  end

  it "renders the latest report and the run history, newest first" do
    user = create(:user)
    older = create(:analysis, user: user, symbol: "AAPL", status: "completed", created_at: 2.days.ago)
    newer = create(:analysis, user: user, symbol: "AAPL", status: "completed", created_at: 1.hour.ago)
    sign_in user

    get ticker_path("AAPL")

    expect(response).to have_http_status(:ok)
    expect(inertia_component).to eq("Tickers/Show")
    expect(inertia_props["symbol"]).to eq("AAPL")
    expect(inertia_props["selected"]["id"]).to eq(newer.id)
    expect(inertia_props["analyses"].map { |run| run["id"] }).to eq([ newer.id, older.id ])
  end

  it "selects a specific historical run" do
    user = create(:user)
    older = create(:analysis, user: user, symbol: "AAPL", status: "completed", created_at: 2.days.ago)
    create(:analysis, user: user, symbol: "AAPL", status: "completed", created_at: 1.hour.ago)
    sign_in user

    get ticker_path("AAPL"), params: { analysis_id: older.id }

    expect(inertia_props["selected"]["id"]).to eq(older.id)
  end

  it "does not expose another user's analyses" do
    user = create(:user)
    other = create(:analysis, user: create(:user), symbol: "AAPL", status: "completed")
    sign_in user

    get ticker_path("AAPL")

    expect(inertia_props["selected"]).to be_nil
    expect(inertia_props["analyses"]).to eq([])
    expect(other).to be_persisted
  end

  it "exposes the watchlist item id when the ticker is tracked" do
    user = create(:user)
    item = create(:watchlist_item, user: user, symbol: "AAPL")
    sign_in user

    get ticker_path("AAPL")

    expect(inertia_props["watchlistItemId"]).to eq(item.id)
  end
end
