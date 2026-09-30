# frozen_string_literal: true

# Orchestrates one analysis: crawl recent news, score sentiment + horizons,
# then persist the result on the Analysis record.
class AnalysisRunner
  def initialize(analysis)
    @analysis = analysis
  end

  def call
    advance("Crawling recent headlines…", 15, status: "running", clear_error: true)
    articles = NewsCrawler.new(@analysis.symbol).call

    advance("Scoring sentiment & horizons…", 45)
    result = SentimentAnalyzer.new(@analysis.symbol, articles).call

    advance("Saving results…", 90)
    @analysis.update!(
      status: "completed",
      stage: "Completed",
      progress: 100,
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
    @analysis.update!(status: "failed", stage: "Failed", error: "#{e.class}: #{e.message}".first(500))
  end

  private

  def advance(stage, progress, status: nil, clear_error: false)
    attributes = { stage: stage, progress: progress }
    attributes[:status] = status if status
    attributes[:error] = nil if clear_error
    @analysis.update!(attributes)
  end

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
