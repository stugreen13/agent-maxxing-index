# Agent Maxxing Index

Dashboard tracking daily open-source ecosystem activity across npm, PyPI, and GitHub.

## Stack

- Next.js 16 (App Router, Cache Components enabled)
- Tailwind v4 + shadcn/ui
- Neon Serverless Postgres + Drizzle ORM
- TypeScript

## Data Sources

Three metrics, one row per source per day in `daily_metrics` table:

| Source | What | API | Rate Limits |
|--------|------|-----|-------------|
| `npm` | Total daily downloads | `api.npmjs.org/downloads/range/{start}:{end}` | Generous, no auth needed |
| `pypi` | Total daily downloads | `pypistats.org/api/packages/__all__/overall` | Generous, no auth needed |
| `github_commits` | Total daily commits | `api.github.com/search/commits` | 10 req/min (search), needs `GITHUB_PAT` with 4s pacing |

## How Data Stays Fresh

No cron jobs. `getDashboardData()` in `src/lib/queries.ts` uses `'use cache'` with 1-hour revalidation. On each cache miss it fetches today's data from APIs, upserts to DB, backfills yesterday if missing, and returns the last 30 days.

`scripts/backfill.ts` is a one-time idempotent script for initial data population (~2 min runtime due to GitHub pacing).

## Environment Variables (.env.local)

- `DATABASE_URL` — Neon connection string
- `GITHUB_PAT` — GitHub personal access token

## Commands

- `npm run dev` — Start dev server
- `npx drizzle-kit push` — Push schema changes to Neon
- `npx tsx scripts/backfill.ts` — Run backfill
