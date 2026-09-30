# frozen_string_literal: true

require "rails_helper"

RSpec.describe User do
  it "has many watchlist items and analyses" do
    expect(described_class.reflect_on_association(:watchlist_items).macro).to eq(:has_many)
    expect(described_class.reflect_on_association(:analyses).macro).to eq(:has_many)
  end

  it "is invalid without an email" do
    expect(described_class.new(email: nil, password: "password123")).not_to be_valid
  end
end
