# frozen_string_literal: true

# Base controller for Mission Control (the Solid Queue dashboard at /jobs).
# Requires a signed-in user; never mounted in production.
class AdminController < ApplicationController
  before_action :authenticate_user!
end
