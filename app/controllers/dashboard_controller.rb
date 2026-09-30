# frozen_string_literal: true

# The watchlist dashboard (root page for signed-in users).
class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    watchlist = current_user.watchlist_items.ordered
    analyses = latest_analyses(watchlist.map(&:symbol))

    render inertia: "Dashboard/Index", props: {
      watchlist: WatchlistItem.inertia_props(watchlist),
      analyses: analyses
    }
  end

  private

  # Newest analysis per symbol, for the watchlist cards' status badges.
  def latest_analyses(symbols)
    return {} if symbols.empty?

    current_user.analyses
                .where(symbol: symbols)
                .recent
                .group_by(&:symbol)
                .transform_values { |runs| runs.first.as_json_payload(include_details: false) }
  end
end
