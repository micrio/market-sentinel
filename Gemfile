source "https://rubygems.org"

ruby "3.4.7"

gem "rails", "~> 7.2.3"
gem "sqlite3", ">= 2.1"
gem "puma", ">= 5.0"
gem "sprockets-rails"
gem "tzinfo-data", platforms: %i[ windows jruby ]
gem "bootsnap", require: false

# Rails 7.2 passes :quirks_mode to JSON.generate, removed in json 3.x.
gem "json", "~> 2.7"

# Inertia.js + Vite/React frontend.
gem "inertia_rails", "~> 3.16"
gem "vite_rails", "~> 3.0"

# Auth.
gem "devise", "~> 4.9"

# Config.
gem "dotenv-rails"

# HTML scraping for financial news (crawler).
gem "nokogiri"

# LLM-backed sentiment + projections (DeepSeek via OpenAI-compatible API).
gem "ruby_llm"

# Background jobs (durable, SQLite-backed) + job dashboard.
gem "solid_queue", "~> 1.0"
gem "mission_control-jobs"

group :development, :test do
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
  gem "brakeman", require: false
  gem "rubocop-rails-omakase", require: false
  gem "rspec-rails", "~> 7.1"
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
end

group :test do
  gem "shoulda-matchers"
  gem "database_cleaner-active_record"
end
