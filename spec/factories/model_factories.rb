# frozen_string_literal: true

FactoryBot.define do
  factory :watchlist_item do
    user
    sequence(:symbol) { |n| "TST#{n}" }
    name { "Test Corp" }
  end

  factory :analysis do
    user
    symbol { "AAPL" }
    status { "pending" }
  end
end
