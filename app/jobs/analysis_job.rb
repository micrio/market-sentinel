# frozen_string_literal: true

# Runs one sentiment analysis in the background (Solid Queue).
class AnalysisJob < ApplicationJob
  queue_as :default

  def perform(analysis_id)
    analysis = Analysis.find_by(id: analysis_id)
    return if analysis.nil? || analysis.finished?

    AnalysisRunner.new(analysis).call
  end
end
