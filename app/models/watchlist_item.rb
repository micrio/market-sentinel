# frozen_string_literal: true

# A ticker the signed-in user wants to track.
class WatchlistItem < ApplicationRecord
  belongs_to :user

  before_validation :normalize_symbol

  validates :symbol, presence: true,
                     format: { with: /\A[A-Z0-9.\-]{1,12}\z/, message: "is not a valid ticker" },
                     uniqueness: { scope: :user_id, case_sensitive: false }

  scope :ordered, -> { order(:symbol) }

  def self.inertia_props(items)
    items.map(&:as_json_payload)
  end

  def as_json_payload
    {
      id: id,
      symbol: symbol,
      name: name,
      createdAt: created_at.iso8601
    }
  end

  private

  def normalize_symbol
    self.symbol = symbol.to_s.strip.upcase.presence
  end
end
