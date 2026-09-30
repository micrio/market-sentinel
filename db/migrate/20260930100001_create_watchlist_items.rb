class CreateWatchlistItems < ActiveRecord::Migration[7.2]
  def change
    create_table :watchlist_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :symbol, null: false
      t.string :name
      t.timestamps
    end

    add_index :watchlist_items, [ :user_id, :symbol ], unique: true
  end
end
