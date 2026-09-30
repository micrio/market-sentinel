# frozen_string_literal: true

# Live quotes for the dashboard ticker cards. GET /quotes?symbols=AAPL,TSLA
class QuotesController < ApplicationController
  before_action :authenticate_user!

  def index
    symbols = params[:symbols].to_s.split(",").map { |s| s.strip.upcase }.reject(&:blank?).first(40)
    quotes = symbols.filter_map do |symbol|
      quote = StockQuote.new(symbol).fetch
      quote && serialize(quote)
    end

    render json: { quotes: quotes }
  end

  private

  def serialize(quote)
    {
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      previousClose: quote.previous_close,
      change: quote.change,
      changePercent: quote.change_percent,
      currency: quote.currency
    }
  end
end
