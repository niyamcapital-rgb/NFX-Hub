# CLAUDE.md — NFX Hub

NFX Hub is a professional trading SaaS built on Next.js 16 (App Router). The legacy vanilla HTML/CSS/JS prototype has been removed. This file is the authoritative source of truth for development.

---

## Running the App

```bash
cd nfx-platform
npm run dev        # http://localhost:3000
npm run build      # production type-check + build
```

The app requires Supabase credentials in `nfx-platform/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Without credentials the middleware and server actions short-circuit and return empty data (safe for UI previewing).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 — App Router, Server Components, Server Actions |
| Styling | Tailwind v4 (`@import "tailwindcss"`, no config file) |
| Components | shadcn/ui — manually installed (no CLI), Tailwind v4 mode |
| Animation | Framer Motion — Emil Kowalski philosophy (see Motion System below) |
| Charts | Recharts — equity curves in AccountCard |
| Auth | Supabase Auth — email/password + Google OAuth |
| Database | Supabase (PostgreSQL) with RLS |
| Storage | Supabase Storage — `trade-charts`, `outlook-charts` buckets (both public) |
| Types | Hand-authored `types/database.ts` (until `supabase gen types` is run) |
| Font | Plus Jakarta Sans via `next/font/google` |

---

## Project Structure

```
nfx-platform/
├── app/
│   ├── (auth)/              # No sidebar — login only
│   │   └── login/page.tsx
│   ├── (dashboard)/         # Sidebar layout for all main views
│   │   ├── layout.tsx       # AppSidebar + PageTransition
│   │   ├── page.tsx         # Dashboard: metrics + calendar
│   │   ├── accounts/page.tsx
│   │   ├── journal/page.tsx
│   │   ├── outlooks/page.tsx
│   │   └── settings/page.tsx  # Symbols management
│   ├── actions/             # Server Actions ('use server')
│   │   ├── account-actions.ts
│   │   ├── auth-actions.ts
│   │   ├── confluence-actions.ts
│   │   ├── outlook-actions.ts
│   │   ├── symbol-actions.ts
│   │   └── trade-actions.ts
│   ├── auth/callback/route.ts  # OAuth code exchange
│   └── layout.tsx           # Root: font + globals.css
├── components/
│   ├── accounts/            # AccountCard, AccountModal, AccountsClient
│   ├── dashboard/           # MetricsStrip, TradeCalendar
│   ├── journal/             # JournalClient, TradeCard, TradeTable, TradeModal
│   ├── outlooks/            # OutlookCard, OutlookModal, OutlooksClient
│   ├── providers/           # PageTransition (AnimatePresence wrapper)
│   ├── settings/            # SettingsClient (symbols management)
│   ├── sidebar/             # AppSidebar, NavItem, MobileMenuTrigger
│   └── ui/                  # shadcn: button, card, badge, dialog, sheet,
│                            #         label, tabs, select, textarea, input
│                            #         + image-dropzone (custom)
├── lib/
│   ├── motion.ts            # Framer Motion variants — Emil Kowalski style
│   ├── storage-utils.ts     # uploadFile() — uploads to Supabase Storage
│   ├── supabase/
│   │   ├── client.ts        # createBrowserClient — use in 'use client' components
│   │   └── server.ts        # createServerClient — use in Server Components/Actions
│   └── utils.ts             # cn() helper
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_schema_v2.sql
│   ├── 003_storage_setup.sql  # Public buckets + RLS upload policies
│   └── 004_symbols.sql        # symbols table with RLS
├── types/
│   └── database.ts          # Database generic + app types (Account, Trade, Symbol, etc.)
├── middleware.ts             # Route protection; skips auth when env vars are absent
└── public/
    └── logo.png             # Brand logo — never alter, always preserve aspect ratio
```

---

## Feature Specification (Source of Truth)

### 1. Architecture & Data Flow

**Mutations → Server Actions + revalidatePath**
All writes go through `app/actions/`. After a successful write the action calls `revalidatePath()` to invalidate the Next.js cache, which triggers a background RSC re-render. Client components use `useOptimistic` (React 19 built-in) to apply changes instantly in the UI before the server re-render completes — eliminating any visible "page refresh" flicker.

**Reads → Server Components**
Page-level data fetching is done in async Server Components (`page.tsx`). The fetched data is passed as props to Client Components (`*Client.tsx`).

**Auth → Supabase Auth**
Email/password + Google OAuth. Protected via `middleware.ts`. All DB queries are scoped to `user_id` via Supabase RLS.

**Modal remount pattern**
All modals are permanently mounted (only `open` prop toggles). Use `key={editing?.id ?? 'new'}` on every modal to force a full remount when switching between records — this resets all internal `useState` cleanly.

---

### 2. Dashboard

- **Metric cards:** Total Trades, Win Rate %, Average RR
- **Trade Calendar heatmap:** Green = Win, Red = Loss. Hover shows RR. Click routes to that trade in Journal.

---

### 3. Account Management

**Modal form fields:** Account Name, Size, Starting Balance, Current Balance, Profit Target %, Daily Loss Limit %, Max Drawdown %, Start Date, Phase (P1 / P2 / Funded), Group (A–E)

**Accounts view:**
- Filter tabs: All + Groups A–E
- Account cards with: equity line chart (Recharts), profit target progress bar, Max DD / Daily DD remaining indicators

---

### 4. Journal (Trades)

**Trade form fields:**
- Open Date, Close Date
- Symbol — DB-driven dropdown from `symbols` table; managed in Settings
- Trade Type: Swing | Intraswing | Intraday | Manipulation
- **Scale-in toggle** — only shown when type is Swing or Intraswing
- Multi-Account selector (chip toggles)
- Risk/Reward, Result (Win / Loss / Breakeven / Pending), P&L
- **Confluences** — inline list within the trade form; click to select, trash icon to delete globally, "Add Confluence" inline input to create shared confluences; no separate dialog
- Summary notes textarea
- **Image uploads** — DXY chart + Entry chart (drag-and-drop via `ImageDropzone` → Supabase Storage `trade-charts` bucket)

**Removed fields (do not re-add):** Direction, Entry Price, Stop Loss, Take Profit

**View modes:**
- **Gallery View (default)** — Notion-style cards: image thumbnail, date, RR, win/loss indicator
- **List View** — tabular layout, toggle via icon button

---

### 5. Outlooks

**Weekly Outlook:**
- Week start date
- Chart image upload (Supabase Storage `outlook-charts` bucket)
- News event image upload
- Narrative / Trading Plan textarea
- Notes textarea

**Daily Outlook:**
- Date
- Chart image upload
- Daily plan textarea

**Display:** Last 6 weekly / 30 daily outlooks on main page.

---

### 6. Settings

- **Symbols** — add/delete trading symbols (e.g. EURUSD, GBPUSD). These populate the Symbol dropdown in the trade form.
- Confluences are managed inline in the Trade form, not here.
- Run `004_symbols.sql` in Supabase to create the symbols table, then add initial symbols via the Settings page.

---

## Database Schema (key tables)

| Table | Purpose |
|---|---|
| `profiles` | Auto-created on signup via trigger |
| `accounts` | Prop/funded accounts; has `phase`, `grp`, `start_date` |
| `trades` | Core trade records; `parent_trade_id` for scale-ins |
| `trade_accounts` | Many-to-many: trades ↔ accounts |
| `trade_confluences` | Many-to-many: trades ↔ confluences |
| `trade_groups` | Many-to-many: trades ↔ groups A–E |
| `confluences` | User-defined tags with `name`, `color` |
| `symbols` | User-defined trading pairs (EURUSD, GBPUSD, etc.) |
| `weekly_outlooks` | Weekly market outlook with `week_start` |
| `daily_outlooks` | Daily outlook with `outlook_date` |

All tables have RLS enabled. Run migrations in order: `001` → `002` → `003` → `004`.

---

## Image Uploads

Images are uploaded client-side using the browser Supabase client via `lib/storage-utils.ts`.

**Flow:**
1. User drops/selects file in `ImageDropzone` (`components/ui/image-dropzone.tsx`)
2. `handleSubmit` in the modal calls `uploadFile(file, bucket, prefix)` from `storage-utils.ts`
3. On success, the returned public URL is appended to the FormData before calling the Server Action
4. If upload fails, an error banner is shown and the save is aborted (never saves with a null URL)
5. If no new file is selected on edit, the existing URL is preserved: `if (!file && trade?.url) fd.set('url', trade.url)`

**Buckets:** `trade-charts` (DXY + entry charts), `outlook-charts` (weekly/daily + news images).
Both buckets are **public** — `getPublicUrl` is used (not signed URLs). The migration `003_storage_setup.sql` creates them with `public: true` and sets RLS policies (auth users can upload; anyone can read).

**PostgreSQL policy syntax gotcha:** `CREATE POLICY IF NOT EXISTS` is **invalid** syntax. Always use `DROP POLICY IF EXISTS` followed by `CREATE POLICY`.

---

## Motion System

All Framer Motion variants live in `lib/motion.ts`. Follows Emil Kowalski's animation philosophy:

**Easing constants (also in globals.css as CSS vars):**
```ts
EASE_OUT    = [0.23, 1, 0.32, 1]    // strong deceleration — all entering elements
EASE_IN_OUT = [0.77, 0, 0.175, 1]   // layout shifts
EASE_DRAWER = [0.32, 0.72, 0, 1]    // sheet/drawer slides
```

**Rules:**
- Durations: 200–300ms. Enter: ~220ms. Exit: ~150ms.
- **Never ease-in on exits** — always `easeOut` (or `EASE_OUT`). Ease-in on exit feels sluggish.
- Use `transform: 'translateY(Xpx)'` string (not `y` shorthand) — GPU compositing, no layout thrash.
- Stagger: 50ms between children (`staggerChildren: 0.05`).
- Sidebar active pill: `layoutId="nav-active-pill"` shared element with spring `{ duration: 0.35, bounce: 0.12 }`.
- Card hover: `translateY(-2px)`, 180ms, `EASE_OUT`.
- Button press: `scale(0.97)` via CSS `button:not([disabled]):active` in globals.css (not Framer Motion).
- No spring on content, no bounce on anything except the nav pill.

---

## CSS / Tailwind Notes

Tailwind v4: uses `@import "tailwindcss"` and `@theme inline` blocks in `app/globals.css`. There is **no** `tailwind.config.ts`. Never add one. Use `@plugin "tailwindcss-animate"` for animation utilities.

shadcn/ui: manually configured via `components.json`. To add a new component, copy the source from shadcn.com and place it in `components/ui/`. Do not use the shadcn CLI.

---

## Design Tokens (globals.css)

```
--background: #000815    (page bg)
--card:       #010916    (card bg)
--border:     #0a1b2e
--primary:    #3b82f6    (blue accent)
--foreground: #ffffff
--muted-foreground: #8a8f9c

--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)
```

---

## Known Pending Work

- Scale-in child trade creation: toggle exists in UI, DB insert not yet implemented
- `useOptimistic` not yet wired into OutlooksClient + OutlookModal
- Image uploads in OutlookModal not yet wired to `lib/storage-utils.ts`
- Stripe subscription gating: not yet implemented
- `npm run build` TypeScript clean pass not yet verified end-to-end
