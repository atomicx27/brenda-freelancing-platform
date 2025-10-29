# SUPABASE SETUP GUIDE FOR BRENDA BACKEND

This guide helps you connect the Brenda backend to Supabase (Postgres + Auth + Storage).

## 1) Create a Supabase project
- Note your project URL and keys
- Enable the Connection Pooler (recommended for Prisma)

## 2) Database URL

Use the pooler URL in your `brenda-backend/.env`:

```
DATABASE_URL=postgresql://<user>:<pass>@<pooler-host>:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

Notes:
- `sslmode=require` is needed
- For pooler, Prisma recommends `pgbouncer=true&connection_limit=1`

## 3) Apply schema

From `brenda-backend`:
```
npm run db:generate
npm run db:push
```

If you prefer migrations:
```
npm run db:migrate
```

## 4) Environment variables

In `.env` also add:
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_URL` (e.g. `http://localhost:5173`)
- `RESEND_API_KEY`, `RESEND_FROM` for email
- Optional: `SUPABASE_URL`, `SUPABASE_ANON_KEY` if you use Supabase client features

## 5) Troubleshooting

P1001 (can’t reach database):
- Project paused? Resume it
- Wrong host/port? Use the Pooler host, port 5432
- Missing SSL? Add `sslmode=require`
- Corporate network/VPN blocking? Try a different network

Tables missing after push:
- Ensure `DATABASE_URL` points to the intended database
- Re-run `npm run db:push`

