# frozen_string_literal: true

# Orchestrates one analysis: crawl recent news, score sentiment + horizons,
# then persist the result on the Analysis record.
class AnalysisRunner
  def initialize(analysis)
    @analysis = analysis
  end

  def call
    @analysis.update!(status: "running", error: nil)

    articles = NewsCrawler.new(@analysis.symbol).call
    result = SentimentAnalyzer.new(@analysis.symbol, articles).call

    @analysis.update!(
      status: "completed",
      bullish: result[:bullish],
      bearish: result[:bearish],
      neutral: result[:neutral],
      summary: result[:summary],
      horizons: result[:horizons],
      catalysts: result[:catalysts],
      articles: serialize(articles),
      completed_at: Time.current
    )
  rescue StandardError => e
    Rails.logger.error("[AnalysisRunner] analysis=#{@analysis.id}: #{e.class}: #{e.message}")
    @analysis.update!(status: "failed", error: "#{e.class}: #{e.message}".first(500))
  end

  private

  def serialize(articles)
    articles.map do |article|
      {
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.published_at&.iso8601,
        snippet: article.snippet
      }
    end
  end
end
