# frozen_string_literal: true

# One sentiment + multi-horizon analysis run for a ticker. Cached so the
# dashboard can show the most recent result without re-crawling.
class Analysis < ApplicationRecord
  STATUSES = %w[pending running completed failed].freeze

  # A completed run younger than this is reused instead of re-crawling and
  # re-scoring. A failed run is held briefly so the button can't be spammed.
  REUSE_WINDOW = 30.minutes
  FAILED_COOLDOWN = 60.seconds
  # In-flight runs older than this are treated as stuck so a new one can run.
  IN_FLIGHT_TIMEOUT = 15.minutes

  belongs_to :user

  validates :symbol, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :progress, numericality: { only_integer: true, in: 0..100 }

  scope :recent, -> { order(created_at: :desc) }

  STATUSES.each do |state|
    define_method("#{state}?") { status == state }
  end

  def finished?
    completed? || failed?
  end

  def self.latest_for(user, symbol)
    where(user: user, symbol: symbol.to_s.upcase).order(created_at: :desc).first
  end

  # Returns an existing analysis that should be reused for a new run request,
  # or nil if a fresh run should be enqueued.
  def self.reusable_for(user, symbol)
    analysis = latest_for(user, symbol)
    return nil if analysis.nil?
    return analysis if (analysis.pending? || analysis.running?) && analysis.created_at > IN_FLIGHT_TIMEOUT.ago
    return analysis if analysis.completed? && analysis.created_at > REUSE_WINDOW.ago
    return analysis if analysis.failed? && analysis.created_at > FAILED_COOLDOWN.ago

    nil
  end

  def as_json_payload(include_details: true)
    payload = {
      id: id,
      symbol: symbol,
      status: status,
      stage: stage,
      progress: progress,
      sentiment: { bullish: bullish, bearish: bearish, neutral: neutral },
      horizons: horizons || {},
      error: error,
      createdAt: created_at.iso8601
    }

    if include_details
      payload.merge!(
        catalysts: catalysts || [],
        articles: articles || [],
        summary: summary,
        completedAt: completed_at&.iso8601
      )
    end

    payload
  end
end
