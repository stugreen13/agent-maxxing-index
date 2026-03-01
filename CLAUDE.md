# Agent Maxxing Index

Dashboard tracking daily open-source ecosystem activity across npm, PyPI, and GitHub.

## Inspiration

Original idea from [@jeff_weinstein](https://x.com/jeff_weinstein/status/2027837552800252338): "it'd be cool to have a live internet-wide aggregated index of 'amount of tinkering' from github, stripe, openrouter, etc."

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

## Data Accuracy

- **npm** (`src/lib/sources/npm.ts`): Total package downloads across all of npm. Reports 0 on some US holidays (e.g. Presidents' Day) — this is an npm API gap, not missing installs. Today/tomorrow may also return 0 until npm finalizes counts.
- **pypi** (`src/lib/sources/pypi.ts`): Uses `with_mirrors` category, so includes mirror traffic. This is the more complete number but higher than direct-only counts.
- **github_commits** (`src/lib/sources/github.ts`): Uses search API `total_count`, which is an approximation for large result sets. Public repos only. Noisiest source — values can fluctuate across queries for the same date.

Use `npm run fix-zeros` to retry any rows stored as 0. Use `npm run backfill` to re-seed the last 30 days (uses `GREATEST` so it won't overwrite good data with zeros).

## How Data Stays Fresh

No cron jobs. `getDashboardData()` in `src/lib/queries.ts` uses `'use cache'` with 1-hour revalidation. On each cache miss it fetches today's data from APIs, upserts to DB, backfills yesterday if missing, and returns the last 30 days.

`scripts/backfill.ts` is a one-time idempotent script for initial data population (~2 min runtime due to GitHub pacing).

## Environment Variables (.env.local)

- `DATABASE_URL` — Neon connection string
- `GITHUB_PAT` — GitHub personal access token

## Commands

- `npm run dev` — Start dev server
- `npx drizzle-kit push` — Push schema changes to Neon
- `npm run backfill` — Backfill last 30 days (safe to re-run, won't overwrite higher values)
- `npm run fix-zeros` — Retry fetching any rows stored as 0
