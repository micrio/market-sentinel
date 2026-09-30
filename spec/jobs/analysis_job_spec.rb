# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalysisJob do
  it "runs the analysis and stores the result" do
    analysis = create(:analysis, status: "pending", symbol: "AAPL")
    article = NewsCrawler::Article.new(
      title: "Apple beats earnings", url: "https://news.test/a", source: "Test",
      published_at: Time.current, snippet: "surge"
    )

    allow_any_instance_of(NewsCrawler).to receive(:call).and_return([ article ])
    allow_any_instance_of(SentimentAnalyzer).to receive(:call).and_return(
      bullish: 70, bearish: 10, neutral: 20, summary: "Good",
      horizons: { "week" => { probability: 70, bias: "Bullish", rationale: "x" } },
      catalysts: [ "Earnings beat" ]
    )

    described_class.perform_now(analysis.id)

    analysis.reload
    expect(analysis).to be_completed
    expect(analysis.bullish).to eq(70)
    expect(analysis.catalysts).to eq([ "Earnings beat" ])
    expect(analysis.articles.first["title"]).to eq("Apple beats earnings")
  end
end
