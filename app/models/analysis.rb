# frozen_string_literal: true

# One sentiment + multi-horizon analysis run for a ticker. Cached so the
# dashboard can show the most recent result without re-crawling.
class Analysis < ApplicationRecord
  STATUSES = %w[pending running completed failed].freeze

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
