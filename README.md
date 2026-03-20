# Shipit

Share anything on the web. Instantly.

Upload your files — websites, PDFs, photos, videos — and get a shareable link in seconds. Each upload gets its own subdomain at `yourname.shipit.studio`.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **Auth:** Better Auth (GitHub OAuth)
- **Database:** Postgres (Neon) + Drizzle ORM
- **Storage:** Cloudflare R2
- **UI:** shadcn/ui, Tailwind CSS v4
- **Monorepo:** Turborepo + pnpm

## Project Structure

```
apps/
  web/              → Next.js app
packages/
  ui/               → Shared UI components (shadcn)
  shared/           → Constants, enums, types
  database/         → Drizzle schema + Postgres client
```

## Getting Started

```bash
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
# Fill in env vars
pnpm dev
```

### Environment Variables

```
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=
APP_DOMAIN=localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

## Deployment

Docker-based deployment via Coolify. See `Dockerfile` for the multi-stage build.

## License

Proprietary
