# 10 - Render Single-Service Deploy

This deploys web + API + Socket.IO on one Render Web Service.

## 1) Push this repo

Push your latest branch (includes `render.yaml`).

## 2) Create service from Blueprint

In Render:

1. `New` -> `Blueprint`
2. Select this repo
3. Confirm the `mighty-decks-ai-storyteller` web service

## 3) Set required env vars

In the Render service settings, set:

- `OPENROUTER_API_KEY=<your_key>`
- `CORS_ORIGINS=https://<your-service>.onrender.com`

Optional:

- `DEBUG_MODE=false`
- `MAX_ACTIVE_ADVENTURES=1`
- model overrides (`OR_TEXT_*`, `OR_IMAGE_MODEL`, etc.)

## 4) Keep one instance

Set service scaling to 1 instance for MVP (state is in-memory).

## 5) Verify

After deploy:

- `https://<your-service>.onrender.com/health`
- open `https://<your-service>.onrender.com/`
- join an adventure and submit an action
