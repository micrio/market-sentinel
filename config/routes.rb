Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  root "dashboard#index"

  resources :watchlist_items, only: %i[create destroy]

  get "tickers/:symbol", to: "tickers#show", as: :ticker, constraints: { symbol: /[^\/]+/ }

  get "quotes", to: "quotes#index"
  post "analyze/:symbol", to: "analyses#create", as: :analyze
  get "analyses/:id", to: "analyses#show", as: :analysis

  # Background job dashboard (Solid Queue) — dev/staging only, never production.
  mount MissionControl::Jobs::Engine, at: "/jobs" unless Rails.env.production?
end
