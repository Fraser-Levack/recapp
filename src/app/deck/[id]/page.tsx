"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { BackLink, Loading } from "@/components/ui";
import { deckStats, isNew } from "@/lib/srs";

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, decks, cards, renameDeck, deleteDeck } = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  const deck = decks.find((d) => d.id === id);
  const deckCards = useMemo(
    () => cards.filter((c) => c.deckId === id).sort((a, b) => b.createdAt - a.createdAt),
    [cards, id],
  );
  const stats = useMemo(() => deckStats(deckCards), [deckCards]);

  if (!ready) return <Loading />;
  if (!deck) {
    return (
      <div className="space-y-4">
        <BackLink href="/" label="Decks" />
        <p className="text-muted">This deck doesn&apos;t exist anymore.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? deckCards.filter((c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q))
    : deckCards;
  const toStudy = stats.due + stats.new;

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/" label="Decks" />
        {renaming === null ? (
          <h1 className="mt-2 text-2xl font-semibold tracking-tight break-words">{deck.name}</h1>
        ) : (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (renaming.trim()) renameDeck(deck.id, renaming);
              setRenaming(null);
            }}
          >
            <input className="input" value={renaming} onChange={(e) => setRenaming(e.target.value)} autoFocus maxLength={200} />
            <button className="btn btn-primary h-auto">Save</button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="New" value={stats.new} className="text-easy" />
        <Stat label="Due" value={stats.due} className="text-good" />
        <Stat label="Total" value={stats.total} />
      </div>

      <div className="flex gap-3">
        {toStudy > 0 ? (
          <Link href={`/study/${deck.id}`} className="btn btn-primary flex-1">
            Study now
          </Link>
        ) : (
          <button className="btn btn-primary flex-1" disabled>
            {stats.total ? "All caught up" : "No cards yet"}
          </button>
        )}
        <Link href={`/add?deck=${deck.id}`} className="btn btn-outline" aria-label="Add card">
          <PlusIcon width={18} height={18} />
          <span className="hidden sm:inline">Add card</span>
        </Link>
      </div>

      {deckCards.length > 0 && (
        <section className="space-y-3">
          {deckCards.length > 5 && (
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" width={18} height={18} />
              <input
                className="input pl-10"
                type="search"
                placeholder="Search cards"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <ul className="panel divide-y divide-line overflow-hidden">
            {visible.map((card) => (
              <li key={card.id}>
                <Link href={`/cards/${card.id}`} className="flex items-start gap-3 px-4 py-3 transition hover:bg-soft">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{card.front}</p>
                    <p className="truncate text-sm text-muted">{card.back}</p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-muted">{dueLabel(card.due, isNew(card))}</span>
                </Link>
              </li>
            ))}
            {visible.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No matches</li>}
          </ul>
        </section>
      )}

      <div className="flex gap-2 border-t border-line pt-4">
        <button className="btn btn-ghost h-9 text-sm" onClick={() => setRenaming(deck.name)}>
          Rename
        </button>
        <button
          className="btn btn-danger h-9 text-sm"
          onClick={() => {
            const n = deckCards.length;
            if (!confirm(`Delete “${deck.name}”${n ? ` and its ${n} card${n === 1 ? "" : "s"}` : ""}?`)) return;
            deleteDeck(deck.id);
            router.push("/");
          }}
        >
          Delete deck
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className={`text-2xl font-semibold tabular-nums ${value ? className : ""}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function dueLabel(due: number, fresh: boolean) {
  if (fresh) return "New";
  const days = Math.ceil((due - Date.now()) / 86_400_000);
  if (days <= 0) return "Due";
  if (days === 1) return "Tomorrow";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
