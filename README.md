# speech-2-text

A simple lightweight application that inputs natural language and utilises NLP to convert it into text-based responses or answers.

This repository includes a **React + Vite + TypeScript** folder structure template you can grow into a full product.

## Folder structure

```
.
├── public/                 # Static assets served as-is (favicon, robots.txt, etc.)
├── src/
│   ├── assets/             # Images, fonts, and files imported by components
│   ├── components/
│   │   ├── layout/         # App shell, headers, footers
│   │   └── ui/             # Reusable presentational components
│   ├── constants/          # App-wide constants and copy
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route-level / screen components
│   ├── routes/             # Route config (wire up react-router here)
│   ├── services/           # API clients and external integrations
│   ├── styles/             # Global CSS and shared style tokens
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Pure helper functions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Application entry point
├── .env.example            # Documented environment variables
├── index.html              # Vite HTML entry
├── package.json
├── tsconfig.json           # TypeScript project references
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run Oxlint               |

## Environment variables

Copy `.env.example` to `.env` and set values as needed. Variables prefixed with `VITE_` are exposed to the client via `import.meta.env`.

## Tech stack

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [TypeScript](https://www.typescriptlang.org/)
