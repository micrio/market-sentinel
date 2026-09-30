class AddProgressToAnalyses < ActiveRecord::Migration[7.2]
  def change
    add_column :analyses, :progress, :integer, default: 0, null: false
    add_column :analyses, :stage, :string
  end
end
