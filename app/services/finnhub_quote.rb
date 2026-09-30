# frozen_string_literal: true

require "net/http"
require "json"

# Fetches a quote from Finnhub (https://finnhub.io), used as a fallback when
# Yahoo's chart endpoint fails. Requires FINNHUB_API_KEY; returns nil on a
# missing key or any failure so callers can degrade gracefully.
class FinnhubQuote
  BASE = "https://finnhub.io/api/v1"
  Result = StockQuote::Result

  def initialize(symbol, timeout: 8, api_key: nil)
    @symbol = symbol.to_s.strip.upcase
    @timeout = timeout
    @api_key = api_key || ENV["FINNHUB_API_KEY"]
  end

  def fetch
    return nil if @symbol.blank? || @api_key.blank?

    data = get_json("/quote", symbol: @symbol)
    return nil if data.nil?

    price = data["c"].to_f
    return nil if price.zero?

    previous = data["pc"].to_f
    previous = price if previous.zero?
    change = data["d"]&.to_f || price - previous
    percent = data["dp"]&.to_f || (previous.zero? ? 0.0 : (change / previous) * 100)

    profile = get_json("/stock/profile2", symbol: @symbol) || {}

    Result.new(
      symbol: @symbol,
      name: profile["name"] || @symbol,
      price: price.round(2),
      previous_close: previous.round(2),
      change: change.round(2),
      change_percent: percent.round(2),
      currency: profile["currency"] || "USD"
    )
  rescue StandardError => e
    Rails.logger.warn("[FinnhubQuote] #{@symbol}: #{e.class}: #{e.message}")
    nil
  end

  private

  def get_json(path, params)
    uri = URI("#{BASE}#{path}")
    uri.query = URI.encode_www_form(params.merge(token: @api_key))
    request = Net::HTTP::Get.new(uri)
    request["Accept"] = "application/json"

    response = Net::HTTP.start(
      uri.host, uri.port,
      use_ssl: true,
      open_timeout: @timeout,
      read_timeout: @timeout
    ) { |http| http.request(request) }

    return nil unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.warn("[FinnhubQuote] #{path}: #{e.class}: #{e.message}")
    nil
  end
end
