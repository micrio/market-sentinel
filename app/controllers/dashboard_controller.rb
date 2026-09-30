# frozen_string_literal: true

# The watchlist dashboard (root page for signed-in users).
class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    render inertia: "Dashboard/Index", props: {
      watchlist: WatchlistItem.inertia_props(current_user.watchlist_items.ordered)
    }
  end
end
