"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { ChevronIcon } from "@/components/icons";
import { Counts, Loading, Notice } from "@/components/ui";
import { deckStats } from "@/lib/srs";

export default function DecksPage() {
  const { ready, decks, cards, createDeck, cloudEnabled, user, guestCards } = useData();
  const [name, setName] = useState("");

  const stats = useMemo(() => {
    const now = Date.now();
    return new Map(decks.map((d) => [d.id, deckStats(cards.filter((c) => c.deckId === d.id), now)]));
  }, [decks, cards]);

  if (!ready) return <Loading />;

  const totalToStudy = [...stats.values()].reduce((n, s) => n + s.due + s.new, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createDeck(name);
    setName("");
  }

  return (
    <div className="space-y-6">
      {cloudEnabled && !user && (
        <Notice
          action={
            <Link href="/account" className="font-medium text-fg">
              Sign in
            </Link>
          }
        >
          Cards are saved on this device. Sign in to sync across devices.
        </Notice>
      )}
      {guestCards > 0 && (
        <Notice
          action={
            <Link href="/account" className="font-medium text-fg">
              Import
            </Link>
          }
        >
          {guestCards} card{guestCards === 1 ? "" : "s"} from guest mode can be added to your account.
        </Notice>
      )}

      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Decks</h1>
        {totalToStudy > 0 && (
          <Link href="/study/all" className="btn btn-primary h-9 px-3.5 text-sm">
            Study all · {totalToStudy}
          </Link>
        )}
      </div>

      {decks.length === 0 ? (
        <div className="panel px-6 py-12 text-center">
          <p className="font-medium">No decks yet</p>
          <p className="mt-1 text-sm text-muted">Create your first deck below to start adding cards.</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line overflow-hidden">
          {decks.map((deck) => {
            const s = stats.get(deck.id)!;
            return (
              <li key={deck.id}>
                <Link href={`/deck/${deck.id}`} className="flex items-center gap-3 px-4 py-4 transition hover:bg-soft">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{deck.name}</p>
                    <p className="text-sm text-muted">
                      {s.total} card{s.total === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Counts due={s.due} fresh={s.new} />
                  <ChevronIcon className="text-muted/60" width={18} height={18} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          className="input"
          placeholder="New deck name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          enterKeyHint="done"
        />
        <button className="btn btn-outline h-auto shrink-0" disabled={!name.trim()}>
          Create
        </button>
      </form>
    </div>
  );
}
