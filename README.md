# Paryatech CRM

Customer CRM workspace with Home, Customers, Queries, Tasks, Inbox, document vault, and customer records.

## Run locally

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/#dashboard`.

## Build and preview

```sh
npm run build
npm run preview
```

Vercel builds this Vite application and publishes `dist/`. The dashboard is available at `/#dashboard`; the customer directory is at `/#customers`.

## UI verification

```sh
npx playwright install chromium
PREVIEW_URL=http://localhost:5173 npm run verify:ui
```

The UI checks cover pagination, row selection, customer search and filters, record tabs, scrolling, forms, tasks, queries, inbox, and responsive layouts.

This application uses sample records and browser-side state. It is a UI prototype without a shared backend.
