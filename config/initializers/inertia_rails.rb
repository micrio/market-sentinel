# frozen_string_literal: true

InertiaRails.configure do |config|
  # Keep these in sync with the `future` flags in
  # app/frontend/entrypoints/application.tsx.
  config.use_script_element_for_initial_page = true
  config.use_data_inertia_head_attribute = true
end
