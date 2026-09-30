# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :watchlist_items, dependent: :destroy
  has_many :analyses, dependent: :destroy
end
