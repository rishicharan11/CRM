# Paryatech CRM

Customer CRM workspace with Home, Customers, Queries, Tasks, Inbox, document vault, vendor creation, reports, and customer records. Query proposals use services that match the recorded travel requirements; unmatched queries show an empty result.

Public dashboard: https://customer-module.vercel.app/#dashboard

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

Additional checks are available through `verify:service-matching`, `verify:service-proposals`, `verify:reports`, `verify:vendor-creation`, and `verify:refresh`.

The bundled vendor catalogue and reports snapshot allow this repository to build independently. When the sibling reference modules are available locally, the prebuild scripts refresh those snapshots.

This application uses sample records and browser-side state. It is a UI prototype without a shared backend.
