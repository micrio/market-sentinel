# frozen_string_literal: true

module Users
  class RegistrationsController < Devise::RegistrationsController
    def new
      redirect_to root_path and return if user_signed_in?

      render inertia: "Auth/SignUp"
    end

    def create
      build_resource(sign_up_params)

      if resource.save
        sign_in(resource_name, resource)
        redirect_to after_sign_up_path_for(resource), notice: "Account created successfully."
      else
        redirect_to new_user_registration_path,
                    inertia: { errors: resource.errors.to_hash.transform_values(&:first) }
      end
    end

    private

    def after_sign_up_path_for(_resource)
      root_path
    end

    def sign_up_params
      params.require(:user).permit(:email, :password, :password_confirmation)
    end
  end
end
