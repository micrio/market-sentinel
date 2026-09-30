# frozen_string_literal: true

require "rails_helper"

RSpec.describe SentimentAnalyzer do
  Article = NewsCrawler::Article

  def article(title)
    Article.new(title: title, url: "https://news.test/#{title.hash}", source: "Test", published_at: Time.current, snippet: title)
  end

  it "returns a keyword-based fallback without an LLM key" do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DEEPSEEK_API_KEY").and_return(nil)

    result = described_class.new("AAPL", [ article("Apple beats earnings and stock surges"), article("Analysts upgrade Apple to buy") ]).call

    expect(result[:bullish]).to be > result[:bearish]
    expect(result[:bullish] + result[:bearish] + result[:neutral]).to eq(100)
    expect(result[:horizons].keys).to contain_exactly("week", "month", "year")
    expect(result[:catalysts]).not_to be_empty
  end

  it "returns a neutral-ish fallback with no articles" do
    result = described_class.new("AAPL", []).call

    expect(result[:catalysts]).to eq([])
    expect(result[:horizons]).to have_key("week")
  end

  it "parses structured JSON from the LLM" do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DEEPSEEK_API_KEY").and_return("test-key")

    payload = {
      bullish: 70, bearish: 10, neutral: 20,
      summary: "Strong momentum.",
      horizons: {
        week: { probability: 70, bias: "Bullish", rationale: "Momentum." },
        month: { probability: 60, bias: "Bullish", rationale: "Catalysts." },
        year: { probability: 50, bias: "Neutral", rationale: "Macro." }
      },
      catalysts: [ "Earnings beat" ]
    }

    chat = instance_double(RubyLLM::Chat)
    message = instance_double(RubyLLM::Message, content: "```json\n#{payload.to_json}\n```")
    allow(RubyLLM).to receive(:chat).and_return(chat)
    allow(chat).to receive(:ask).and_return(message)

    result = described_class.new("AAPL", [ article("upgrade") ]).call

    expect(result[:bullish]).to eq(70)
    expect(result[:neutral]).to eq(20)
    expect(result[:horizons]["week"][:bias]).to eq("Bullish")
    expect(result[:catalysts]).to eq([ "Earnings beat" ])
  end
end
