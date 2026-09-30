# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analysis do
  it "reports finished only once completed or failed" do
    expect(build(:analysis, status: "pending")).not_to be_finished
    expect(build(:analysis, status: "running")).not_to be_finished
    expect(build(:analysis, status: "completed")).to be_finished
    expect(build(:analysis, status: "failed")).to be_finished
  end

  it "includes sentiment and details in the payload" do
    analysis = create(
      :analysis,
      status: "completed",
      bullish: 60,
      bearish: 20,
      neutral: 20,
      horizons: { "week" => { "probability" => 60, "bias" => "Bullish", "rationale" => "x" } },
      catalysts: [ "Earnings beat" ],
      articles: []
    )

    payload = analysis.as_json_payload
    expect(payload[:sentiment]).to eq(bullish: 60, bearish: 20, neutral: 20)
    expect(payload[:catalysts]).to eq([ "Earnings beat" ])
  end
end
