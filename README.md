# Budget.AI

Budget.AI is your personal AI powered budgeting assistant. It provides a dashboard for you or other users to record transactions, view the change in balances over time, and get suggestions for how to better budget your life!

## Current stack
Frontend
<ul style="list-style-type: none; padding: 0; margin: 0 0 1rem 0;">
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/vite/646CFF" style="margin-right: 0.2rem;"/> Vite</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/react/61DAFB" style="margin-right: 0.2rem;"/> React</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/typescript/3178C6" style="margin-right: 0.2rem;"/> TypeScript</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/tailwindcss/06B6D4" style="margin-right: 0.2rem;"/> TailwindCSS</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/shadcnui/000000/ffffff" style="margin-right: 0.2rem;"/> shadcn/ui</li>
</ul>

Backend
<ul style="list-style-type: none; padding: 0; margin: 0 0 1rem 0;">
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/python/3776AB" style="margin-right: 0.2rem;"/> Python</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/fastapi/009688" style="margin-right: 0.2rem;"/> FastAPI</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><picture style="margin-right: 0.2rem;">
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://unpkg.com/@lobehub/icons-static-png@latest/dark/groq.png"
  />
  <img height="24" src="https://unpkg.com/@lobehub/icons-static-png@latest/light/groq.png" />
</picture> Groq</li>
    <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/langchain-color.png" style="margin-right: 0.2rem;"/> LangChain</li>
    <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://serper.dev/favicon.ico" style="margin-right: 0.2rem;"/> Serper</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" src="https://cdn-images-1.medium.com/max/1200/1*7B-88PmnmGE5J7oRQscIeg.png" style="margin-right: 0.2rem;"/> Plaid API</li>
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" src="https://jwt.io/img/pic_logo.svg" style="margin-right: 0.2rem;"/> JWT Auth</li>
</ul>

Database
<ul style="list-style-type: none; padding: 0; margin: 0 0 1rem 0;">
  <li style="display: flex; align-items: center; padding: 0.1rem;"><img height="24" width="24" src="https://cdn.simpleicons.org/sqlite/003B57" style="margin-right: 0.2rem;"/> SQLite</li>
  </ul>


## Setup
To setup, ensure you have NPM, Pipenv, and SQLite installed and configured.

1. Make a copy of the [.example.env](./.example.env) file and rename it to [.env](./.env). Fill in your Groq API key.
2. Generate a JWT Secret Key with `openssl rand -hex 32`
3. Run `npm build`
4. Run `pipenv install -d`
5. Run `pipenv run frontend` to start up the frontend
6. In a separate terminal, run `pipenv run server` to start up the backend.
> All other commands that can be run can be found in the `[scripts]` section of the Pipfile
