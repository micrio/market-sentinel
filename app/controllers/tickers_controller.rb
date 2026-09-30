# frozen_string_literal: true

# Per-ticker detail page: latest sentiment report plus the history of previous
# runs (all persisted on the Analysis records).
class TickersController < ApplicationController
  before_action :authenticate_user!

  def show
    @symbol = params[:symbol].to_s.strip.upcase
    return head :not_found if @symbol.blank?

    item = current_user.watchlist_items.find_by(symbol: @symbol)
    scope = current_user.analyses.where(symbol: @symbol).recent

    selected = if params[:analysis_id].present?
                 scope.find_by(id: params[:analysis_id])
               else
                 scope.first
               end

    render inertia: "Tickers/Show", props: {
      symbol: @symbol,
      name: item&.name,
      watchlistItemId: item&.id,
      inWatchlist: item.present?,
      selected: selected&.as_json_payload,
      analyses: scope.limit(100).map { |analysis| analysis.as_json_payload(include_details: false) }
    }
  end
end
