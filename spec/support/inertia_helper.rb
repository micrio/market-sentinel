# frozen_string_literal: true

module InertiaHelper
  # Returns the decoded Inertia page object from the response body. Handles both
  # the legacy `data-page` attribute and the Inertia 2 JSON script element.
  def inertia_page
    raw =
      response.body[%r{<script[^>]*data-page[^>]*>(.*?)</script>}m, 1] ||
      response.body[/data-page="([^"]*)"/, 1]

    return {} if raw.blank?

    JSON.parse(CGI.unescapeHTML(raw))
  end

  def inertia_component
    inertia_page["component"]
  end

  def inertia_props
    inertia_page["props"] || {}
  end
end

RSpec.configure do |config|
  config.include InertiaHelper, type: :request
end
