# BRENDA BACKEND SETUP GUIDE

This guide helps you run the Brenda backend locally with Prisma, PostgreSQL/Supabase, and environment variables.

## 1) Prerequisites

- Node.js 18+
- npm 9+
- A PostgreSQL database (local or hosted)
- Alternatively, a Supabase project (recommended)

## 2) Environment variables

Create `brenda-backend/.env` from `brenda-backend/env.example` and set the following:

Required:
- `DATABASE_URL` → Postgres connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` → any strong random strings
- `FRONTEND_URL` → include your dev origins (e.g. `http://localhost:5173`)

Email (Resend):
- `RESEND_API_KEY` → your Resend API key
- `RESEND_FROM` → verified sender email (e.g. `onboarding@resend.dev` for testing)

### Supabase (via Pooler)

Use the “Connection Pooler” string from Supabase and add SSL and PgBouncer flags:

```
DATABASE_URL=postgresql://<user>:<pass>@<your-pooler-host>:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

If you see P1001 (cannot reach database), ensure:
- Project is not paused
- Pooler is enabled
- Your network can reach the pooler host
- SSL is required (`sslmode=require`)

## 3) Install and generate Prisma client

From `brenda-backend`:

```
npm install
npm run db:generate
```

If this is a fresh DB, push the schema:

```
npm run db:push
```

If you use migrations instead:

```
npm run db:migrate
```

## 4) Run the API

```
npm run dev
```

Health check: http://localhost:5000/health

## 5) Common issues

P1001 (DB unreachable):
- Verify `DATABASE_URL` host/port, SSL, PgBouncer flags
- Check firewall/VPN
- Ensure the Supabase project is awake

CORS:
- Add your frontend origin to `FRONTEND_URL` (comma-separated to allow multiple)

Auth errors:
- All `/api/automation` routes require a valid JWT. Log in from the frontend first.

