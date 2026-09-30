# frozen_string_literal: true

# Resolves a quote through a 30-minute cache so upstream providers (Yahoo,
# Finnhub) are hit at most once per symbol per TTL. Freshness is purely
# age-based: within the TTL the cached quote (and its `updated_at`) is served,
# so asking again — including via the Refresh button — only reaches a provider
# once the cached entry has expired.
class QuoteLookup
  CACHE_TTL = 30.minutes

  def self.call(symbol)
    new(symbol).call
  end

  def initialize(symbol)
    @symbol = symbol.to_s.strip.upcase
  end

  def call
    return nil if @symbol.blank?

    cached = Rails.cache.read(cache_key)
    return build(cached) if cached

    result = StockQuote.new(@symbol).fetch || FinnhubQuote.new(@symbol).fetch
    return nil if result.nil?

    result.updated_at = Time.current
    Rails.cache.write(cache_key, dump(result), expires_in: CACHE_TTL)
    result
  end

  private

  def cache_key
    "quote/#{@symbol}"
  end

  # Cache a plain Hash (not the Struct) so reloaded code can't make stored
  # entries incompatible with a changed StockQuote::Result definition.
  def dump(result)
    {
      symbol: result.symbol,
      name: result.name,
      price: result.price,
      previous_close: result.previous_close,
      change: result.change,
      change_percent: result.change_percent,
      currency: result.currency,
      updated_at: result.updated_at
    }
  end

  def build(attributes)
    return nil unless attributes.is_a?(Hash)

    StockQuote::Result.new(**attributes)
  end
end
