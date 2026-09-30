# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  it "redirects signed-out visitors to sign in" do
    get root_path

    expect(response).to redirect_to(new_user_session_path)
  end

  it "renders the watchlist for signed-in users" do
    user = create(:user)
    create(:watchlist_item, user: user, symbol: "AAPL")
    create(:analysis, user: user, symbol: "AAPL", status: "completed")
    sign_in user

    get root_path

    expect(response).to have_http_status(:ok)
    expect(inertia_component).to eq("Dashboard/Index")
    expect(inertia_props["watchlist"].map { |item| item["symbol"] }).to eq([ "AAPL" ])
    expect(inertia_props["analyses"]["AAPL"]["status"]).to eq("completed")
  end
end
