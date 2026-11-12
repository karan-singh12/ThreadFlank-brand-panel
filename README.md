# Threadflank — Brand Panel (Next.js)

The portal for fashion brands on Threadflank. A brand signs up with its own login (separate from shopper and admin accounts), then manages its catalog, previews AI motion videos, schedules launch drops and bids for Top-10 runway slots. It talks to the backend's `/api/brand/*` routes.

The app also ships the public marketing site (landing, pricing, contact, legal pages) and the brand try-on widget iframe.

Project docs live in [`../Documentation`](../Documentation): [`prd.md`](../Documentation/prd.md) (features), [`trd.md`](../Documentation/trd.md) (architecture and APIs), [`progress_checklist.md`](../Documentation/progress_checklist.md) (status).

## Stack
- Next.js 16 (App Router) and React 19. This Next.js version has breaking changes from older releases; read `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).
- TypeScript, Tailwind CSS 4 (tokens in `src/app/globals.css`), Framer Motion, lucide-react
- React Hook Form + Zod for auth and catalog forms
- Cheerio for the product-link scraper

## Brand panel sections
All five sections live in the `(brand)` route group, behind `RequireAuth`, and share one `BrandPanelProvider` (profile and data) and `BrandShell` (header, avatar menu, mobile tab bar).

| Section | Route | What it does |
|---|---|---|
| Dashboard | `/dashboard` | Analytics overview: impressions, try-ons, clicks to your store |
| Catalog | `/catalog` | Add, edit and delete garments; import from a product link; edit the buy URL |
| AI Studio | `/ai-studio` | **Write copy** (live): product descriptions, Instagram captions, launch announcements, email blurbs and SEO text in English, Hindi or Hinglish, written from the real catalog; 2 credits, charged only on success. **Motion video**: UI ready, rendering not connected yet (no charge) |
| Drops | `/drops` | Schedule launch drops with a banner, date and waitlist count |
| Bidding | `/bidding` | Bid on Top-10 runway slots by category; see winning/outbid status |

Auth pages (`/login`, `/signup`, `/forgot-password`, `/reset-password/[token]`, `/verify-email/[token]`) use the brand auth endpoints, with access and refresh tokens (`src/features/auth/refresh.ts`).

## Getting started
The backend (`../Backend`) must be running on `:3003` with the database migrated (`npx prisma db push`).

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

The backend's `BRAND_EMAIL_VERIFY_URL` and `BRAND_PASSWORD_RESET_URL` should point at this app (`http://localhost:3000/verify-email` and `/reset-password`). The User-Panel also defaults to `:3000`, so run one of them with `npm run dev -- -p <port>` and update those URLs to match.

## Environment
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL including `/api` (default `http://localhost:3003/api`) |
| `NEXT_PUBLIC_LEGAL_ENTITY` | Legal entity shown in the footer copyright |
| `IMAGE_ENGINES` | Order to try image engines (default `replicate,gemini,openai,openrouter`) |
| `REPLICATE_API_TOKEN` | Replicate engine (try-on quality and video) |
| `GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY` | Other image engines; need billing enabled for image output |
| `GEMINI_IMAGE_MODEL`, `OPENAI_IMAGE_MODEL`, `OPENROUTER_IMAGE_MODEL` | Optional model overrides |

Everything except the `NEXT_PUBLIC_` variables is server-only and read by the route handlers.

## Structure
```text
src/
├── app/
│   ├── (site)/        # Landing, pricing, contact, legal, shared look /s/[token], post /p/[id]
│   ├── (auth)/        # Brand login, signup, email verification, password reset
│   ├── (brand)/       # Signed-in brand panel: dashboard, catalog, ai-studio, drops, bidding
│   ├── (app)/         # Shopper-app pages carried over from the User-Panel
│   ├── api/           # Route handlers: cutout, fetch-garment, post-card, share-card, studio/engines
│   └── embed/try-on/  # Brand widget iframe (loaded by public/widget.js)
├── features/
│   ├── brand-panel/   # Provider, shell, nav, API client and the five section views
│   ├── auth/          # Auth provider, forms, token storage and refresh
│   └── …              # Shared shopper features (billing, app shell, …)
├── components/        # Shared UI (controls, cards, charts, modal, layout, landing sections)
├── data/              # UI copy and option lists
└── lib/
    ├── api/           # REST client and config
    └── server/        # Server-only helpers (image engine, public-URL guard)
```

## Backend endpoints used
| Area | Routes |
|---|---|
| Auth | `POST /brand/auth/{register,signup,login,verify-email,resend-verification,forgot-password,reset-password,refresh,logout}`, `GET /brand/auth/me` |
| Profile | `GET`/`PATCH /brand/profile` |
| Catalog | `GET`/`POST /brand/catalog`, `GET`/`PATCH`/`DELETE /brand/catalog/:id` |
| Analytics | `GET /brand/analytics/overview`, `POST /brand/analytics/track-click` |
| AI Studio | `GET /brand/ai-studio/presets`, `POST /brand/ai-studio/simulate`, `POST /brand/ai-studio/content` |
| Drops | `GET`/`POST /brand/drops` |
| Bidding | `GET /brand/bidding/slots`, `POST /brand/bidding/slots/:rank/bid` |
| Upload | `POST /brand/upload/{base64,file}` |

Drops and bidding are held in memory on the backend for now, so they reset when it restarts.

## Brand try-on widget
`public/widget.js` is the script brands embed on their own store. It opens `/embed/try-on` in an iframe. Per-brand keys and allowed domains are managed in the admin panel.

## Checks
```bash
npx tsc --noEmit
npx eslint src
npm run build
```
