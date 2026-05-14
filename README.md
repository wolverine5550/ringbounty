<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Proxy
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Requirements

- **Node.js** 20.9.0 or newer. Next.js 16 [dropped Node.js 18](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/upgrading/version-16.mdx); use a current Node 20 or 22 release.
- **npm** 10 or newer is recommended (bundled with current Node installers).

The repo root `package.json` includes an `engines.node` field that matches this minimum.

## Environment variables

### Required for local development

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the browser and server Supabase clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon or publishable key (public configuration for the client; still not a password—rotate from the dashboard if leaked). |

Create `.env.local` from `.env.example` and set values from your [Supabase project API settings](https://supabase.com/dashboard/project/_/settings/api).

### Optional (Vercel / hosting)

| Name | Purpose |
|------|---------|
| `VERCEL_URL` | Hostname for the current deployment; the starter template uses it to build default URLs when present. |
| `VERCEL_ENV` | `development`, `preview`, or `production` on Vercel. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Canonical production hostname on Vercel. |

### Planned integrations (names only; not required for the baseline app)

These are reserved for upcoming work—do not commit real secrets:

- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase admin usage when features require it.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe payments and webhooks.
- `OPENROUTER_API_KEY` — AI gateway (or an equivalent provider key if you swap vendors).
- `NOMOROBO_API_KEY`, `YOUMAIL_API_KEY` — optional spam / reputation providers.
- `OPENCORPORATES_API_KEY` — optional business-entity lookup.
- `FTC_DNC_*` (or vendor-specific names once chosen) — federal DNC / compliance integrations (spike TBD).

## Supabase project (RingBounty)

RingBounty uses a **hosted** Supabase project (no local Supabase stack required for day-to-day app development).

| | |
|--|--|
| **Project ref** | `nktlhjjeqwpubzlvjpjv` |
| **Dashboard** | [Project home](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv) |
| **API URL** (same value as `NEXT_PUBLIC_SUPABASE_URL`) | `https://nktlhjjeqwpubzlvjpjv.supabase.co` |

The project ref is public metadata (it appears in URLs); it is **not** a secret. Database password, service role keys, and access tokens must never be committed.

### Database migrations

Versioned SQL lives in [`supabase/migrations/`](supabase/migrations/). **Naming:** `YYYYMMDDHHMMSS_short_description.sql` (UTC wall-clock timestamp + snake_case description), e.g. `20260514143000_enable_pgcrypto.sql`, so files sort in apply order.

**Apply migrations without the Supabase CLI (current default):**

1. Open the [SQL Editor](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv/sql/new) for this project.
2. Run each file’s contents **in timestamp order** (oldest first). Prefer a new query tab per migration so you can keep an audit trail of what ran.

**Optional — Supabase CLI later:** When you adopt the CLI, run `supabase login`, then `supabase link --project-ref nktlhjjeqwpubzlvjpjv`, then push pending files with `supabase db push`. For a **local** database only, `supabase migration up` / `supabase db reset` apply what is under `supabase/migrations/` per the [Supabase CLI database docs](https://supabase.com/docs/guides/deployment/database-migrations).

### Public schema and the Data API (PostgREST / supabase-js)

Supabase is tightening defaults: **new** tables in `public` may not be exposed to the Data API until you grant explicitly to `anon`, `authenticated`, and (for admin paths) `service_role`. Rollout: **May 30, 2026** for new projects; **October 30, 2026** for existing projects. If a grant is missing, PostgREST often returns **42501** with a suggested `GRANT` in the message.

RingBounty migrations that create app tables include **RLS** plus **explicit `GRANT`s** so `supabase-js` and REST keep working after those dates. When you add a new `public` table, mirror that pattern (RLS policies + grants per role). Use the dashboard [Security Advisor](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv/advisors/security) to audit access.

**Current reference tables (see `prd.md` section 5):** `public.violation_types` (seeded catalog; read-only for `anon` / `authenticated`), `public.users` (profile row per auth user; `select` / `update` own row only; rows synced from `auth.users` via trigger), `public.claims` (consumer claim; `authenticated` DML on own `user_id` rows only; no `anon` grant—anonymous funnel uses the service role on the server), `public.claim_subjects` (child rows per claim; RLS via **EXISTS** subquery to owned `claims`), `public.dnc_check_results` (federal/state/internal DNC columns per claim or subject; same **EXISTS** pattern to owned `claims`), `public.claim_events` (append-only-style `event_type` / `key` / `value` / `source` log; same **EXISTS** pattern to owned `claims`), `public.letters` (purchased letter rows; optional `claim_subject_id`, `demand_scenario`; RLS so `authenticated` users only see rows where `user_id = auth.uid()`), and v0.2 referral tables **`public.law_firms`**, **`public.firm_users`**, **`public.leads`** (`authenticated` **select** only for linked firm users / assigned leads per `supabase/migrations/20260515103000_leads_firm_portal_rls.sql`; **insert/update/delete** for those tables still require **`service_role`** until firm-portal writes ship). `call_category` app constants live in [`src/lib/constants/claimSubject.ts`](src/lib/constants/claimSubject.ts). `claim_events` literals live in [`src/lib/constants/claimEvent.ts`](src/lib/constants/claimEvent.ts).

**Generated `Database` types:** [`src/types/database.ts`](src/types/database.ts) is produced from the hosted schema, for example:

```bash
npx supabase gen types typescript --project-id nktlhjjeqwpubzlvjpjv 2>/dev/null > src/types/database.ts
```

Re-run after migrations so `SupabaseClient<Database>` in [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts), [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts), and [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts) stays accurate.

**Optional RLS smoke tests (Vitest):** [`src/lib/supabase/rls-smoke.test.ts`](src/lib/supabase/rls-smoke.test.ts) runs live checks when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set (e.g. in `.env.local`). Set **`SUPABASE_SERVICE_ROLE_KEY`** (server-only; never commit) to enable the service-role branch, and **`VITEST_SUPABASE_USER_ACCESS_TOKEN`** (short-lived user JWT from the dashboard or a test login) to exercise the “authenticated JWT in `Authorization` header” branch. CI skips these when env vars are absent.

**Letter PDF storage (convention):** when you add a Supabase Storage bucket for generated PDFs, store objects at **`letters/{user_id}/{letter_id}.pdf`** (replace with your bucket name prefix if you namespace buckets differently). `public.letters.pdf_url` should point at the final public or signed URL returned to the client.

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Developer workflow

Husky installs Git hooks through the `prepare` script after `npm install`.

Before each commit, `.husky/pre-commit` runs `npx lint-staged` against staged JavaScript and TypeScript files, then runs `npm run typecheck` for the full TypeScript project. `lint-staged` currently runs ESLint with `--fix` on staged `*.{js,jsx,ts,tsx}` files.

In an emergency, hooks can be skipped with `HUSKY=0 git commit ...`, but this should be reserved for broken work-in-progress commits and followed by a normal passing commit as soon as possible.

## App shell and semantic colors

- **Layout:** The root layout wraps all routes in [`src/components/layout/site-shell.tsx`](src/components/layout/site-shell.tsx): a top **header** landmark (reserved for global navigation), a single document **main** around page content, and a slim **footer** for the global “not legal advice” notice. Nested routes should use `<section>` / `<div>` for inner regions so there is only one `<main>` per page.
- **Shadcn / Tailwind:** CLI config lives in [`components.json`](components.json); the Tailwind entrypoint is [`src/app/globals.css`](src/app/globals.css) (aligned with the `src/app` tree).
- **Claim-strength tokens:** CSS variables `--success`, `--warning`, `--caution`, and `--danger` (with matching `*-foreground` values) are defined for light and dark themes and exposed as Tailwind colors `success`, `warning`, `caution`, and `danger` in [`tailwind.config.ts`](tailwind.config.ts). Use them for outcome / claim-strength UI (green → yellow → orange → red). `destructive` remains the default shadcn control color for destructive actions.

## Continuous integration

GitHub Actions runs on every pull request and on pushes to `main` (see `.github/workflows/ci.yml`). It installs dependencies with `npm ci`, then runs `npm run lint`, `npm run typecheck`, and `npm run test` (Vitest unit tests). This complements Husky and does not replace local checks before you commit.

## Testing

### Unit tests (Vitest)

- `npm run test` — run the Vitest suite once (CI uses this).
- `npm run test:watch` — watch mode while developing.

Specs live next to source files as `*.test.ts` / `*.test.tsx` under `src/`. Shared Supabase test doubles live in [`src/test-utils/mockSupabaseClient.ts`](src/test-utils/mockSupabaseClient.ts); swap the placeholder `Database` type when generated schema types are checked in.

### End-to-end tests (Playwright)

- One-time browser install: `npx playwright install` (or `npx playwright install chromium` for a smaller footprint).
- `npm run test:e2e` — run Playwright against specs in [`e2e/`](e2e/).

The included wiring spec does not start Next.js. Specs that hit `http://127.0.0.1:3000` need `npm run dev` in another terminal (or a `webServer` block in `playwright.config.ts`). See [`e2e/README.md`](e2e/README.md).

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
