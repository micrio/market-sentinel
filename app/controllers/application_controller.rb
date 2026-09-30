# frozen_string_literal: true

class ApplicationController < ActionController::Base
  inertia_share do
    {
      auth: {
        signedIn: user_signed_in?,
        user: current_user && { id: current_user.id, email: current_user.email }
      },
      flash: { notice: flash[:notice], alert: flash[:alert] }
    }
  end

  private

  def after_sign_in_path_for(_resource)
    root_path
  end

  def after_sign_out_path_for(_resource)
    new_user_session_path
  end
end
