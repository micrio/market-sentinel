# frozen_string_literal: true

require "open-uri"
require "json"
require "fileutils"

namespace :tickers do
  desc "Build the bundled US ticker directory from NASDAQ Trader symbol files"
  task build: :environment do
    sources = {
      "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt" => { name: 1, test: 3 },
      "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt" => { name: 1, test: 6 }
    }
    noise = /\b(warrant|warrants|right|rights|unit|units|preferred|depositary|notes?)\b/i

    rows = {}
    sources.each do |url, cols|
      body = URI.open(url, "User-Agent" => "Mozilla/5.0").read
      body.each_line.drop(1).each do |line|
        cells = line.chomp.split("|")
        next if cells.size < 8

        symbol = cells[0].to_s.strip.upcase
        name = cells[cols[:name]].to_s.gsub(/\s+/, " ").strip
        next if symbol.empty? || symbol == "FILE CREATION TIME" || cells[cols[:test]] == "Y"

        rows[symbol] ||= name
      end
    end

    data = rows.sort.filter_map do |symbol, name|
      next if name.match?(noise)

      short = name.sub(/[-–]\s*(Class|Series|Common|Ordinary).*/i, "").strip[0, 48].to_s.strip
      next if short.empty?

      [ symbol, short ]
    end

    path = Rails.root.join("app/frontend/data/us_tickers.json")
    FileUtils.mkdir_p(path.dirname)
    File.write(path, JSON.generate(data))
    puts "Wrote #{data.size} tickers to #{path}"
  end
end
