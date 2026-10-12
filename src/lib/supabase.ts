import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Card, Deck } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Null when Supabase isn't configured — the app then runs in local-only mode. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

type DeckRow = { id: string; name: string; created_at: number };
type CardRow = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due: number;
  last_review: number | null;
  created_at: number;
  updated_at: number;
};

const deckFromRow = (r: DeckRow): Deck => ({ id: r.id, name: r.name, createdAt: r.created_at });
const deckToRow = (d: Deck): DeckRow => ({ id: d.id, name: d.name, created_at: d.createdAt });

const cardFromRow = (r: CardRow): Card => ({
  id: r.id,
  deckId: r.deck_id,
  front: r.front,
  back: r.back,
  ease: r.ease,
  interval: r.interval_days,
  reps: r.reps,
  lapses: r.lapses,
  due: r.due,
  lastReview: r.last_review,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const cardToRow = (c: Card): CardRow => ({
  id: c.id,
  deck_id: c.deckId,
  front: c.front,
  back: c.back,
  ease: c.ease,
  interval_days: c.interval,
  reps: c.reps,
  lapses: c.lapses,
  due: c.due,
  last_review: c.lastReview,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

function must<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error;
  return data;
}

function client() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

/** Row-level security scopes every query to the signed-in user. */
export const cloud = {
  async loadAll() {
    const sb = client();
    const [decks, cards] = await Promise.all([
      sb.from("decks").select("id,name,created_at").order("created_at"),
      sb.from("cards").select("*"),
    ]);
    return {
      decks: (must(decks) as DeckRow[]).map(deckFromRow),
      cards: (must(cards) as CardRow[]).map(cardFromRow),
    };
  },
  async upsertDecks(decks: Deck[]) {
    if (decks.length) must(await client().from("decks").upsert(decks.map(deckToRow)));
  },
  async deleteDeck(id: string) {
    must(await client().from("decks").delete().eq("id", id));
  },
  async upsertCards(cards: Card[]) {
    if (cards.length) must(await client().from("cards").upsert(cards.map(cardToRow)));
  },
  async deleteCard(id: string) {
    must(await client().from("cards").delete().eq("id", id));
  },
};
