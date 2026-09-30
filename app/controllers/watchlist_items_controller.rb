# frozen_string_literal: true

# Add / remove tickers on the user's watchlist.
class WatchlistItemsController < ApplicationController
  before_action :authenticate_user!

  def create
    item = current_user.watchlist_items.new(symbol: params[:symbol], name: params[:name])

    if item.save
      redirect_to root_path, notice: "#{item.symbol} added to your watchlist."
    else
      redirect_to root_path, alert: item.errors.full_messages.to_sentence
    end
  end

  def destroy
    current_user.watchlist_items.find(params[:id]).destroy
    redirect_to root_path, notice: "Removed from your watchlist."
  end
end
