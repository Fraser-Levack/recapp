"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { uid } from "@/lib/id";
import { schedule } from "@/lib/srs";
import { cloud, supabase } from "@/lib/supabase";
import type { Card, Deck, Grade } from "@/lib/types";

const LOCAL_KEY = "recapp:v1";
/** Key used before the app was renamed from Recall; read so existing guest data isn't lost. */
const LEGACY_LOCAL_KEY = "recall:v1";
const GUEST = "guest";

type Snapshot = { decks: Deck[]; cards: Card[] };
/** `owner` is the user id the data belongs to, or "guest" for on-device data. */
type Store = Snapshot & { owner: string };

function readLocal(): Snapshot {
  try {
    const raw = localStorage.getItem(LOCAL_KEY) ?? localStorage.getItem(LEGACY_LOCAL_KEY);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {}
  return { decks: [], cards: [] };
}

function writeLocal(s: Snapshot) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  } catch {}
}

const message = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String(e.message) : "Something went wrong";

type DataContext = {
  ready: boolean;
  cloudEnabled: boolean;
  user: User | null;
  decks: Deck[];
  cards: Card[];
  /** Number of guest cards on this device that could be imported into the signed-in account. */
  guestCards: number;
  error: string | null;
  clearError: () => void;
  createDeck: (name: string) => Deck;
  renameDeck: (id: string, name: string) => void;
  deleteDeck: (id: string) => void;
  addCard: (deckId: string, front: string, back: string) => Card;
  updateCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  reviewCard: (id: string, grade: Grade) => Card | undefined;
  importGuestData: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<DataContext | null>(null);

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [store, setStore] = useState<Store | null>(null);
  const [guestCards, setGuestCards] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;
  const owner = userId ?? GUEST;
  const ready = authReady && store?.owner === owner;
  const isCloud = owner !== GUEST;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Load the data for whoever is signed in (or the on-device guest data).
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      if (owner === GUEST) {
        setStore({ owner, ...readLocal() });
        return;
      }
      try {
        const data = await cloud.loadAll();
        if (!cancelled) setStore({ owner, ...data });
      } catch (e) {
        if (!cancelled) {
          setError(`Couldn't load your cards: ${message(e)}`);
          setStore({ owner, decks: [], cards: [] });
        }
      }
      if (!cancelled) setGuestCards(readLocal().cards.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, owner]);

  // Guest data lives in localStorage.
  useEffect(() => {
    if (store?.owner === GUEST) writeLocal({ decks: store.decks, cards: store.cards });
  }, [store]);

  /** Fire-and-forget cloud write; local state is updated optimistically. */
  const sync = useCallback(
    (op: () => Promise<void>) => {
      if (!isCloud) return;
      op().catch((e) => setError(`Couldn't save: ${message(e)}`));
    },
    [isCloud],
  );

  const update = (fn: (s: Store) => Store) => setStore((s) => (s ? fn(s) : s));

  const createDeck = useCallback(
    (name: string) => {
      const deck: Deck = { id: uid(), name: name.trim(), createdAt: Date.now() };
      update((s) => ({ ...s, decks: [...s.decks, deck] }));
      sync(() => cloud.upsertDecks([deck]));
      return deck;
    },
    [sync],
  );

  const renameDeck = useCallback(
    (id: string, name: string) => {
      const deck = store?.decks.find((d) => d.id === id);
      if (!deck) return;
      const renamed = { ...deck, name: name.trim() };
      update((s) => ({ ...s, decks: s.decks.map((d) => (d.id === id ? renamed : d)) }));
      sync(() => cloud.upsertDecks([renamed]));
    },
    [store, sync],
  );

  const deleteDeck = useCallback(
    (id: string) => {
      update((s) => ({
        ...s,
        decks: s.decks.filter((d) => d.id !== id),
        cards: s.cards.filter((c) => c.deckId !== id),
      }));
      sync(() => cloud.deleteDeck(id));
    },
    [sync],
  );

  const addCard = useCallback(
    (deckId: string, front: string, back: string) => {
      const now = Date.now();
      const card: Card = {
        id: uid(),
        deckId,
        front,
        back,
        ease: 2.5,
        interval: 0,
        reps: 0,
        lapses: 0,
        due: now,
        lastReview: null,
        createdAt: now,
        updatedAt: now,
      };
      update((s) => ({ ...s, cards: [...s.cards, card] }));
      sync(() => cloud.upsertCards([card]));
      return card;
    },
    [sync],
  );

  const updateCard = useCallback(
    (card: Card) => {
      const next = { ...card, updatedAt: Date.now() };
      update((s) => ({ ...s, cards: s.cards.map((c) => (c.id === card.id ? next : c)) }));
      sync(() => cloud.upsertCards([next]));
    },
    [sync],
  );

  const deleteCard = useCallback(
    (id: string) => {
      update((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));
      sync(() => cloud.deleteCard(id));
    },
    [sync],
  );

  const reviewCard = useCallback(
    (id: string, grade: Grade) => {
      const card = store?.cards.find((c) => c.id === id);
      if (!card) return;
      const next = schedule(card, grade);
      update((s) => ({ ...s, cards: s.cards.map((c) => (c.id === id ? next : c)) }));
      sync(() => cloud.upsertCards([next]));
      return next;
    },
    [store, sync],
  );

  const importGuestData = useCallback(async () => {
    const local = readLocal();
    try {
      await cloud.upsertDecks(local.decks);
      await cloud.upsertCards(local.cards);
    } catch (e) {
      setError(`Import failed: ${message(e)}`);
      return;
    }
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LEGACY_LOCAL_KEY);
    setGuestCards(0);
    update((s) => {
      const deckIds = new Set(s.decks.map((d) => d.id));
      const cardIds = new Set(s.cards.map((c) => c.id));
      return {
        ...s,
        decks: [...s.decks, ...local.decks.filter((d) => !deckIds.has(d.id))],
        cards: [...s.cards, ...local.cards.filter((c) => !cardIds.has(c.id))],
      };
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo<DataContext>(
    () => ({
      ready,
      cloudEnabled: !!supabase,
      user,
      decks: ready ? store!.decks : [],
      cards: ready ? store!.cards : [],
      guestCards: isCloud ? guestCards : 0,
      error,
      clearError: () => setError(null),
      createDeck,
      renameDeck,
      deleteDeck,
      addCard,
      updateCard,
      deleteCard,
      reviewCard,
      importGuestData,
      signOut,
    }),
    [ready, user, store, isCloud, guestCards, error, createDeck, renameDeck, deleteDeck, addCard, updateCard, deleteCard, reviewCard, importGuestData, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
