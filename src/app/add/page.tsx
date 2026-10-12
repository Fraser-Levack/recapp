"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CardForm, type CardValues } from "@/components/CardForm";
import { useData } from "@/components/DataProvider";
import { CloseIcon } from "@/components/icons";
import { Loading } from "@/components/ui";

const LAST_DECK_KEY = "recapp:lastDeck";
/** Key used before the app was renamed from Recall. */
const LEGACY_LAST_DECK_KEY = "recall:lastDeck";

function AddCard() {
  const { ready, decks, addCard } = useData();
  const router = useRouter();
  const params = useSearchParams();

  if (!ready) return <Loading />;

  let lastDeck: string | null = null;
  try {
    lastDeck = localStorage.getItem(LAST_DECK_KEY) ?? localStorage.getItem(LEGACY_LAST_DECK_KEY);
  } catch {}
  const preferred = [params.get("deck"), lastDeck].find((id) => id && decks.some((d) => d.id === id));

  function save({ deckId, front, back, reverse }: CardValues) {
    addCard(deckId, front, back);
    if (reverse) addCard(deckId, back, front);
    try {
      localStorage.setItem(LAST_DECK_KEY, deckId);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Add card</h1>
        <button onClick={() => router.back()} className="btn btn-ghost size-10 p-0" aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <CardForm mode="add" initial={{ deckId: preferred ?? "", front: "", back: "" }} onSubmit={save} />
    </div>
  );
}

export default function AddPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AddCard />
    </Suspense>
  );
}
