# frozen_string_literal: true

# Starts and polls a sentiment analysis for a ticker.
class AnalysesController < ApplicationController
  before_action :authenticate_user!

  def create
    symbol = params[:symbol].to_s.strip.upcase

    if symbol.blank?
      return render json: { error: "A ticker symbol is required." }, status: :unprocessable_content
    end

    analysis = current_user.analyses.create!(symbol: symbol, status: "pending")
    AnalysisJob.perform_later(analysis.id)

    render json: analysis.as_json_payload, status: :created
  end

  def show
    analysis = current_user.analyses.find(params[:id])
    render json: analysis.as_json_payload
  end
end
