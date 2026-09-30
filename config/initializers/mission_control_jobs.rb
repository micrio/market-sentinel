# frozen_string_literal: true

# Mission Control → Jobs dashboard for Solid Queue, mounted at /jobs.
# We use Devise (AdminController#authenticate_user!) instead of HTTP basic auth.
MissionControl::Jobs.base_controller_class = "AdminController"
MissionControl::Jobs.http_basic_auth_enabled = false
