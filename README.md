# speech-2-text

A lightweight React app that listens to live speech, detects when you finish an utterance, and shows a text response on screen using an OpenAI-compatible chat API.

## Features

- **Live microphone input** via the browser Web Speech API (Chrome, Edge, Safari)
- **Pause-to-send**: when you stop speaking, the transcript is sent to the API
- **On-screen responses** with a scrollable history of turns
- **Env-based API token** — no secrets committed to the repo

## Getting started

```bash
npm install
cp .env.example .env
# Edit .env and set VITE_API_TOKEN
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), allow microphone access, and click **Start listening**.

### Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run Oxlint               |

## Environment variables

Copy `.env.example` to `.env`. Restart the dev server after changes.

| Variable             | Required | Description                                      |
| -------------------- | -------- | ------------------------------------------------ |
| `VITE_API_TOKEN`     | Yes      | Bearer token for chat completions                |
| `VITE_API_BASE_URL`  | No       | API base URL (default: `https://api.openai.com/v1`) |
| `VITE_API_MODEL`     | No       | Model name (default: `gpt-4o-mini`)              |

Variables prefixed with `VITE_` are bundled into the client. For production, prefer a small backend proxy so the token is not exposed in the browser.

## Folder structure

```
src/
├── components/conversation/   # Live listener UI
├── hooks/                     # Speech + conversation orchestration
├── services/conversationApi.ts
└── ...
```

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- Web Speech API for recognition
- OpenAI-compatible `POST /chat/completions`
