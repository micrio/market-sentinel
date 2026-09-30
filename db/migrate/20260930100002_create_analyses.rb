class CreateAnalyses < ActiveRecord::Migration[7.2]
  def change
    create_table :analyses do |t|
      t.references :user, null: false, foreign_key: true
      t.string :symbol, null: false
      t.string :status, null: false, default: "pending"

      t.integer :bullish, null: false, default: 0
      t.integer :bearish, null: false, default: 0
      t.integer :neutral, null: false, default: 0

      t.json :horizons
      t.json :catalysts
      t.json :articles
      t.text :summary
      t.text :error
      t.datetime :completed_at

      t.timestamps
    end

    add_index :analyses, [ :symbol, :created_at ]
    add_index :analyses, :status
  end
end
