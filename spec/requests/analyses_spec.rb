# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Analyses", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "POST /analyze/:symbol" do
    it "creates a pending analysis and enqueues the job" do
      expect do
        post analyze_path(symbol: "AAPL")
      end.to have_enqueued_job(AnalysisJob)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["symbol"]).to eq("AAPL")
      expect(body["status"]).to eq("pending")
      expect(body["stage"]).to eq("Queued")
      expect(body["progress"]).to eq(0)
    end

    it "rejects a blank symbol" do
      post "/analyze/%20"

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "reuses a recent completed run without enqueuing" do
      existing = create(:analysis, user: user, symbol: "AAPL", status: "completed", created_at: 5.minutes.ago)

      expect do
        post analyze_path(symbol: "AAPL")
      end.not_to have_enqueued_job(AnalysisJob)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(existing.id)
    end

    it "reuses an in-flight run without enqueuing a duplicate" do
      existing = create(:analysis, user: user, symbol: "AAPL", status: "running")

      expect do
        post analyze_path(symbol: "AAPL")
      end.not_to have_enqueued_job(AnalysisJob)

      expect(response.parsed_body["id"]).to eq(existing.id)
    end

    it "enqueues a new run when the last completed one is stale" do
      create(:analysis, user: user, symbol: "AAPL", status: "completed", created_at: 2.hours.ago)

      expect do
        post analyze_path(symbol: "AAPL")
      end.to have_enqueued_job(AnalysisJob)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /analyses/:id" do
    it "returns the analysis payload" do
      analysis = create(:analysis, user: user, symbol: "MSFT", status: "completed", bullish: 55, bearish: 25, neutral: 20)

      get analysis_path(analysis)

      body = response.parsed_body
      expect(body["status"]).to eq("completed")
      expect(body["sentiment"]).to eq("bullish" => 55, "bearish" => 25, "neutral" => 20)
    end
  end
end
