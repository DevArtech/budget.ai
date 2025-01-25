# Budget.AI

Budget.AI is your personal AI powered budgeting assistant. It provides a dashboard for you or other users to record transactions, view the change in balances over time, and get suggestions for how to better budget your life!

Budget.AI is built with Vite + React + TSX (Frontend), Python + FastAPI + Groq (Backend) and SQLite (Database).

To setup, ensure you have NPM, Pipenv, and SQLite installed and configured.

1. Make a copy of the [.example.env](./.example.env) file and rename it to [.env](./.env). Fill in your Groq API key.
2. Generate a JWT Secret Key with `openssl rand -hex 32`
3. Run `npm build`
4. Run `pipenv install -d`
5. Run `pipenv run frontend` to start up the frontend
6. In a separate terminal, run `pipenv run server` to start up the backend.
