# frozen_string_literal: true

# Starts and polls a sentiment analysis for a ticker.
class AnalysesController < ApplicationController
  before_action :authenticate_user!

  def create
    symbol = params[:symbol].to_s.strip.upcase

    if symbol.blank?
      return render json: { error: "A ticker symbol is required." }, status: :unprocessable_content
    end

    existing = Analysis.reusable_for(current_user, symbol)
    return render json: existing.as_json_payload, status: :ok if existing

    analysis = current_user.analyses.create!(symbol: symbol, status: "pending", stage: "Queued", progress: 0)
    AnalysisJob.perform_later(analysis.id)

    render json: analysis.as_json_payload, status: :created
  end

  def show
    analysis = current_user.analyses.find(params[:id])
    render json: analysis.as_json_payload
  end
end
