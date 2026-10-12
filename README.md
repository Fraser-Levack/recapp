# RecApp

A minimal, mobile-friendly spaced-repetition flashcard app (an Anki-style clone) built with Next.js, TypeScript and Tailwind.

- **Decks & cards**: create, rename, search, edit, delete
- **Spaced repetition**: SM-2 scheduler with Again / Hard / Good / Easy, like Anki
- **Fast adding on a phone**: the big **+** in the bottom bar opens a screen that keeps the keyboard up between cards, remembers your last deck, and can add a reversed card too
- **Works with no setup**: cards are saved in the browser (guest mode)
- **Optional accounts and sync**: free via [Supabase](https://supabase.com). Guest cards can be imported after signing in
- **Installable**: "Add to Home Screen" on iOS and Android to open it like an app
- Light and dark mode follow the system setting

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**To try it on your phone** on the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<your-PC's-IP>:3000` on the phone. Run `ipconfig` to find the IP.

## Enable accounts and sync (free)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the tables and the row-level security rules, so each user can only see their own cards.
3. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**: the project URL and the publishable (or anon) key.
4. Restart `npm run dev`.

By default, Supabase asks new users to confirm their email address. You can turn this off for testing under **Authentication → Sign In / Providers → Email → Confirm email**. When you deploy, add your site URL under **Authentication → URL Configuration** so the confirmation links point to it.

## Deploy (free)

Push the project to GitHub, import it at [vercel.com](https://vercel.com), and add the same two `NEXT_PUBLIC_SUPABASE_*` environment variables.

## Keyboard shortcuts (desktop)

| Where | Key | Action |
|---|---|---|
| Study | Space / Enter | Show the answer, then grade it Good |
| Study | 1 – 4 | Again / Hard / Good / Easy |
| Add / Edit | Ctrl/⌘ + Enter | Save the card |

## Project layout

```
src/lib/srs.ts                  scheduler, queue building, deck stats
src/lib/supabase.ts             Supabase client and cloud read/write
src/components/DataProvider.tsx app state; switches between local and cloud storage
src/components/CardForm.tsx     shared add/edit form
src/app/                        pages: decks, deck/[id], study/[id], add, cards/[id], account
supabase/schema.sql             database tables and security policies
```
