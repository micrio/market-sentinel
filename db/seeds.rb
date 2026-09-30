# frozen_string_literal: true

User.find_or_create_by!(email: "admin@user.com") do |user|
  user.password = "password"
  user.password_confirmation = "password"
end
