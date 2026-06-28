# Lumora Studio

A multi-model AI image & video generation platform for creators and marketers.
Generate images and video across multiple models, build consistent characters,
clone voices, and produce ad creatives — all from one studio.

> Lumora is original branding (name, logo, palette). It is not affiliated with
> any existing product.

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 14 (App Router) + TypeScript                |
| Styling      | Tailwind CSS                                         |
| Database     | PostgreSQL via Prisma ORM                            |
| Auth         | NextAuth.js (Google OAuth + email magic link)       |
| Job queue    | BullMQ + Redis (added in a later phase)             |
| Storage      | Cloudflare R2 (S3-compatible, added later)          |
| Billing      | Stripe (added later)                                |
| AI models    | fal.ai / Replicate aggregators (added later)        |
| Voice        | ElevenLabs (added later)                            |

## Project status

This project is being built in phases. **Phase 1 is complete:**

- ✅ Auth (NextAuth) with Google OAuth + email magic-link providers
- ✅ Prisma schema: `User`, `Generation`, `ReferenceElement`, `Character`,
  `CreditTxn`, `Subscription`, `Preset` (+ NextAuth tables)
- ✅ Credits system foundation (balance + auditable ledger via `CreditTxn`)
- ✅ Dashboard shell with sidebar nav, credit display, and module placeholders

Upcoming phases: image generation (fal.ai) → credits/Stripe → multi-model +
presets + reference elements → video → gallery/upscale/bg-removal →
marketing studio → voice/dubbing → polish.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

- `DATABASE_URL` — a PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- One auth provider:
  - **Google:** `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, or
  - **Email:** the `EMAIL_SERVER_*` + `EMAIL_FROM` SMTP variables

> If no provider is configured the login page will tell you so rather than
> crashing.

### 3. Set up the database

```bash
npm run prisma:generate   # generate the Prisma client
npm run prisma:push       # create tables (or use prisma:migrate)
npm run db:seed           # optional: seed starter presets
```

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Useful scripts

| Script                   | Description                          |
| ------------------------ | ------------------------------------ |
| `npm run dev`            | Start the dev server                 |
| `npm run build`          | Production build (runs prisma generate) |
| `npm run typecheck`      | TypeScript type-check                |
| `npm run prisma:studio`  | Open Prisma Studio                   |
| `npm run db:seed`        | Seed starter presets                 |
