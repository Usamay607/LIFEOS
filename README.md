# LOS (Life Operating System) v1

Notion-first relational backend + lightweight Next.js dashboard for focus-first daily execution.

## What is implemented
- Monorepo layout with:
  - `apps/web`: LOS dashboard UI + API routes
  - `packages/types`: shared domain contracts
  - `packages/notion`: service layer, mock seed, Notion integration, automations, redaction
- Core modules:
  - Entities
  - Projects
  - Tasks
  - Projects + Tasks workflow workspace
  - Journal
  - LOS Assistant (read-only)
  - Guided Weekly Review (20-minute workflow)
  - Launch Readiness Checklist
  - Startup Hub (go-live readiness)
  - Finance runway
  - Learning pathways/courses
  - Accounts (vault references only)
  - Health + Training overview (logs + workouts + weekly trends)
  - Family + Events overview (milestones + relationship cadence)
  - Transition + Time-Off overview (readiness + pre-sabbatical plans)
- Required APIs:
  - `GET /api/dashboard/home`
  - `GET /api/accounts`
  - `POST /api/assistant/query`
  - `GET /api/system/readiness`
  - `GET /api/journal`
  - `POST /api/journal`
  - `GET /api/entities`
  - `PATCH /api/entities/:id`
  - `GET /api/projects?status=...`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
  - `GET /api/finance/runway`
  - `GET /api/health/overview`
  - `GET /api/learning/overview`
  - `GET /api/family/overview`
  - `GET /api/transition/overview`
  - `POST /api/reviews/weekly-summary`
  - `POST /api/hooks/task-completed`
- Optional dashboard auth gate via `LOS_DASHBOARD_PIN`.

## Security defaults
- No passwords stored in LOS.
- Accounts store only 1Password reference fields (`vault_item_url`, optional `vault_item_id`).
- Weekly AI summary uses strict redaction by default.

## Quick start
1. Install dependencies:
```bash
pnpm install
```
2. Copy env file:
```bash
cp .env.example .env
```
3. Run with mock seed data:
```bash
pnpm dev
```
4. Open [http://localhost:3000](http://localhost:3000)

## Run checks
```bash
pnpm test
pnpm lint
pnpm typecheck
```

## Notion mode
1. Set `LOS_DATA_MODE=notion`.
2. Fill all `NOTION_DATABASE_*_ID` values in `.env`.
3. Ensure schemas match [docs/NOTION_SCHEMA.md](./docs/NOTION_SCHEMA.md).
4. (Optional) Seed starter pack to Notion:
```bash
pnpm --filter @los/notion seed:notion
```

## Design notes
- Bento layout with progressive disclosure.
- Finance card follows the supplied cashflow concept.
- Mobile + desktop parity is supported in the same code paths.
- PWA polish included: install prompt, app shortcuts, offline fallback route (`/offline`), and mobile quick actions.
- App-level fallback UX included for runtime and not-found errors.
