# speech-2-text

A lightweight React app that listens to live speech, detects when you finish an utterance, and shows a text response using the **Cursor Cloud Agents API**.

## Features

- **Live microphone input** via the browser Web Speech API (Chrome, Edge, Safari)
- **Pause-to-send**: when you stop speaking, the transcript is sent to Cursor
- **On-screen responses** with a scrollable history of turns
- **Cursor API key in `.env`** (`crsr_…`) — proxied locally so the browser never calls OpenAI

## Getting started

```bash
npm install
cp .env.example .env
```

1. Open [Cursor Dashboard → Integrations → User API Keys](https://cursor.com/dashboard?tab=integrations).
2. Create a key (`crsr_…`) and set `VITE_API_TOKEN` in `.env`.
3. Keep `VITE_API_BASE_URL=/api/cursor` (default). **Do not** use `api.openai.com` with a Cursor key.

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), allow microphone access, and click **Start listening**.

### StackBlitz note

StackBlitz/WebContainer dev servers often fail to proxy to `api.cursor.com` (`socket hang up` / **502**). That is an environment network limit, not a bad API key. **Clone the repo and run `npm run dev` locally** (or deploy with a server-side proxy) for reliable Cursor API access.

### Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run Oxlint               |

## Environment variables

Restart `npm run dev` after editing `.env`.

| Variable              | Required | Description |
| --------------------- | -------- | ----------- |
| `VITE_API_TOKEN`      | Yes      | Cursor user API key (`crsr_…`) |
| `VITE_API_BASE_URL`   | No       | Default `/api/cursor` (Vite proxy to `api.cursor.com`) |
| `VITE_API_MODEL`      | No       | Optional Cursor model id (e.g. `composer-2.5`) |

The dev server injects your key on proxied requests so it is not sent from browser JavaScript. Avoid deploying the static build alone with a client-exposed key; use a server proxy for production.

## Tech stack

- React + Vite + TypeScript
- Web Speech API for recognition
- [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) (`POST /v1/agents`, follow-up runs, poll for `result`)
