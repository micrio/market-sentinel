# frozen_string_literal: true

require "json"

# Scores news sentiment and generates multi-horizon projections for a ticker.
#
# Primary path: an LLM (DeepSeek via RubyLLM) returns structured JSON.
# Fallback path: a keyword-based scorer so the app still works without a key.
class SentimentAnalyzer
  BULLISH_WORDS = %w[
    beat beats surge surges soar soars rally rallies jump jumps gain gains
    upgrade upgrades outperform buy bullish record high profit profits growth
    strong raised raises optimistic win wins breakout momentum
  ].freeze

  BEARISH_WORDS = %w[
    miss misses plunge plunges crash crashes drop drops fall falls slump slumps
    downgrade downgrades underperform sell bearish loss losses weak cut cuts
    lawsuit probe investigation fraud warning recession decline slowing layoffs
  ].freeze

  def initialize(symbol, articles, model: nil)
    @symbol = symbol.to_s.strip.upcase
    @articles = Array(articles)
    @model = model || ENV.fetch("DEEPSEEK_MODEL", "deepseek-chat")
  end

  # Returns a Hash: symbol keys :bullish, :bearish, :neutral, :summary,
  # :horizons (week/month/year), :catalysts.
  def call
    return fallback if @articles.empty?
    return fallback unless llm_configured?

    from_llm || fallback
  rescue StandardError => e
    Rails.logger.warn("[SentimentAnalyzer] #{@symbol}: #{e.class}: #{e.message}")
    fallback
  end

  private

  def llm_configured?
    ENV["DEEPSEEK_API_KEY"].present?
  end

  def from_llm
    chat = RubyLLM.chat(model: @model)
    response = chat.ask(prompt)
    parse(response.content)
  rescue StandardError => e
    Rails.logger.warn("[SentimentAnalyzer] LLM failed: #{e.class}: #{e.message}")
    nil
  end

  def prompt
    <<~PROMPT
      You are a financial market sentiment analyst. Read the news articles about #{@symbol}
      and reply with ONLY compact JSON (no markdown fences, no prose) in exactly this shape:

      {
        "bullish": <int 0-100>,
        "bearish": <int 0-100>,
        "neutral": <int 0-100>,
        "summary": "<two-sentence overview>",
        "horizons": {
          "week":  { "probability": <int 0-100>, "bias": "Bullish|Bearish|Neutral", "rationale": "<one sentence>" },
          "month": { "probability": <int 0-100>, "bias": "Bullish|Bearish|Neutral", "rationale": "<one sentence>" },
          "year":  { "probability": <int 0-100>, "bias": "Bullish|Bearish|Neutral", "rationale": "<one sentence>" }
        },
        "catalysts": ["<short catalyst>", "..."]
      }

      Rules: bullish + bearish + neutral must equal 100. "probability" is confidence in the
      stated bias for that horizon. Base everything only on the articles below.

      Articles:
      #{article_digest}
    PROMPT
  end

  def article_digest
    @articles.first(10).map.with_index(1) do |article, index|
      date = article.published_at&.strftime("%Y-%m-%d") || "unknown date"
      "#{index}. #{article.title} (#{article.source}, #{date})\n   #{article.snippet}"
    end.join("\n")
  end

  def parse(content)
    json = content.to_s.strip.sub(/\A```(?:json)?/, "").sub(/```\z/, "").strip
    data = JSON.parse(json)

    bullish = data["bullish"].to_i
    bearish = data["bearish"].to_i
    neutral = [ 100 - bullish - bearish, 0 ].max

    {
      bullish: bullish,
      bearish: bearish,
      neutral: neutral,
      summary: data["summary"].to_s.strip,
      horizons: normalize_horizons(data["horizons"]),
      catalysts: Array(data["catalysts"]).map { |c| c.to_s.strip }.reject(&:blank?).first(6)
    }
  rescue JSON::ParserError => e
    Rails.logger.warn("[SentimentAnalyzer] bad JSON: #{e.message}")
    nil
  end

  def normalize_horizons(horizons)
    horizons = {} unless horizons.is_a?(Hash)

    %w[week month year].each_with_object({}) do |key, memo|
      entry = horizons[key] || {}
      memo[key] = {
        probability: entry["probability"].to_i.clamp(0, 100),
        bias: %w[Bullish Bearish Neutral].find { |b| b == entry["bias"] } || "Neutral",
        rationale: entry["rationale"].to_s.strip
      }
    end
  end

  # Keyword scorer used when no LLM key is configured (or the LLM fails).
  def fallback
    text = @articles.map { |a| "#{a.title} #{a.snippet}" }.join(" ").downcase
    bullish_hits = BULLISH_WORDS.count { |word| text.include?(word) }
    bearish_hits = BEARISH_WORDS.count { |word| text.include?(word) }
    total = bullish_hits + bearish_hits

    if total.zero?
      bullish = 33
      bearish = 33
    else
      bullish = ((bullish_hits.to_f / total) * 100).round
      bearish = 100 - bullish
    end
    neutral = [ 100 - bullish - bearish, 0 ].max

    bias = if bullish > bearish + 10
             "Bullish"
           elsif bearish > bullish + 10
             "Bearish"
           else
             "Neutral"
           end
    confidence = [ [ bullish, bearish ].max, 50 ].max

    {
      bullish: bullish,
      bearish: bearish,
      neutral: neutral,
      summary: "Keyword-based read of #{@articles.size} recent headlines for #{@symbol}.",
      horizons: {
        "week" => { probability: confidence, bias: bias, rationale: "Short-term momentum from recent headlines." },
        "month" => { probability: [ confidence - 5, 50 ].max, bias: bias, rationale: "Medium-term trend shaped by current news flow." },
        "year" => { probability: 55, bias: "Neutral", rationale: "Long-term outlook needs fundamentals beyond headlines." }
      },
      catalysts: @articles.first(5).map(&:title)
    }
  end
end
