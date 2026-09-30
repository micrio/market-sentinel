# frozen_string_literal: true

module Users
  class SessionsController < Devise::SessionsController
    def new
      redirect_to root_path and return if user_signed_in?

      render inertia: "Auth/SignIn"
    end

    def create
      self.resource = warden.authenticate(auth_options)

      if resource
        sign_in(resource_name, resource)
        redirect_to after_sign_in_path_for(resource), notice: "Signed in successfully."
      else
        redirect_to new_user_session_path,
                    inertia: { errors: { email: "Invalid email or password." } }
      end
    end
  end
end
