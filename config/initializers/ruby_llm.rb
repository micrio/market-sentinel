# frozen_string_literal: true

# DeepSeek via RubyLLM (OpenAI-compatible). The key lives in .env (dotenv-rails).
RubyLLM.configure do |config|
  config.deepseek_api_key = ENV["DEEPSEEK_API_KEY"]
  config.default_model = ENV.fetch("DEEPSEEK_MODEL", "deepseek-chat")
end
