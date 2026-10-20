# speech-2-text

A lightweight React app that listens to live speech, detects when you finish an utterance, and shows a text response using the **Cursor Cloud Agents API**.

## Features

- **Live microphone input** via the browser Web Speech API (Chrome, Edge, Safari)
- **Pause-to-send**: when you stop speaking, the transcript is sent to Cursor
- **On-screen responses** with a scrollable history of turns
- **Cursor API key** (`crsr_…`) kept on the server via a proxy (local Vite or Vercel)

## Option A — Local development (recommended)

```bash
npm install
cp .env.example .env
```

1. [Cursor Dashboard → Integrations → User API Keys](https://cursor.com/dashboard?tab=integrations) → create `crsr_…`
2. In `.env`:

```env
VITE_API_TOKEN=crsr_your_key
VITE_API_BASE_URL=/api/cursor
VITE_API_MODEL=composer-2.5
```

3. `npm run dev` → [http://localhost:5173](http://localhost:5173)

## Option B — StackBlitz (use a Vercel proxy)

StackBlitz **cannot** reach `api.cursor.com` from its dev server (`socket hang up` / **502**). Use a hosted proxy:

### 1. Deploy to Vercel

- Import this GitHub repo in [Vercel](https://vercel.com/new)
- Add environment variable: **`CURSOR_API_KEY`** = your `crsr_…` key (Production)
- Redeploy after env changes (uses `vercel.json` + `api/cursor-handler.ts`)
- Test: `https://YOUR-PROJECT.vercel.app/api/cursor/v1/me` should **not** be a Vercel 404

### 2. Point StackBlitz at the proxy

In StackBlitz `.env` (no API key in the browser):

```env
VITE_API_BASE_URL=https://YOUR-PROJECT.vercel.app/api/cursor
VITE_API_MODEL=composer-2.5
```

Restart the StackBlitz dev server. The app calls your Vercel URL; Vercel calls Cursor with `CURSOR_API_KEY`.

### Full proxy URL shape

| Piece | Example |
| ----- | ------- |
| Vercel deployment | `https://speech-2-text-abc.vercel.app` |
| Proxy base (`VITE_API_BASE_URL`) | `https://speech-2-text-abc.vercel.app/api/cursor` |
| Example API call | `https://speech-2-text-abc.vercel.app/api/cursor/v1/agents` |

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run Oxlint               |

## Environment variables

| Variable | Local dev | StackBlitz + Vercel |
| -------- | --------- | ------------------- |
| `VITE_API_TOKEN` | Yes (`crsr_…` in `.env`) | Leave empty |
| `VITE_API_BASE_URL` | `/api/cursor` | `https://….vercel.app/api/cursor` |
| `VITE_API_MODEL` | `composer-2.5` (optional) | Same |
| `CURSOR_API_KEY` | — | Set on **Vercel** only (runtime proxy; required) |

On Vercel you do **not** need `VITE_API_TOKEN` if you use `VITE_API_BASE_URL=/api/cursor` on the same deployment — use **`CURSOR_API_KEY`** only so the key is not baked into the client bundle.

## Tech stack

- React + Vite + TypeScript
- Web Speech API
- [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)
- Vercel serverless proxy (`api/cursor/[...path].ts`) with CORS for cross-origin frontends
