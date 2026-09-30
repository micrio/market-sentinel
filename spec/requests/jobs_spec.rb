# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mission Control", type: :request do
  it "is mounted at /jobs" do
    expect(Rails.application.routes.recognize_path("/jobs")[:controller])
      .to start_with("mission_control/jobs")
  end

  it "redirects signed-out visitors to sign in" do
    get "/jobs"

    expect(response).to redirect_to(new_user_session_path)
  end
end
