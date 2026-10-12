"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useData } from "@/components/DataProvider";
import { CloseIcon } from "@/components/icons";
import { buildQueue, isNew, previewInterval, RELEARN_WINDOW } from "@/lib/srs";
import type { Grade } from "@/lib/types";

const GRADES: { grade: Grade; label: string; color: string }[] = [
  { grade: 0, label: "Again", color: "text-again" },
  { grade: 1, label: "Hard", color: "text-hard" },
  { grade: 2, label: "Good", color: "text-good" },
  { grade: 3, label: "Easy", color: "text-easy" },
];

/** /study/<deckId>, or /study/all for every deck. */
export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, decks, cards, reviewCard } = useData();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const all = id === "all";
  const deck = decks.find((d) => d.id === id);
  const exitHref = all || !deck ? "/" : `/deck/${id}`;

  // Snapshot the queue once when data is ready; later card updates don't reshuffle it.
  useEffect(() => {
    if (ready && queue === null) {
      setQueue(buildQueue(all ? cards : cards.filter((c) => c.deckId === id)));
    }
  }, [ready, queue, cards, all, id]);

  const current = queue?.length ? cards.find((c) => c.id === queue[0]) : undefined;

  const grade = useCallback(
    (g: Grade) => {
      if (!current) return;
      const next = reviewCard(current.id, g);
      setReviewed((n) => n + 1);
      setRevealed(false);
      setQueue((q) => {
        const rest = (q ?? []).slice(1);
        return next && next.due - Date.now() < RELEARN_WINDOW ? [...rest, next.id] : rest;
      });
    },
    [current, reviewCard],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        grade((Number(e.key) - 1) as Grade);
      } else if (revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        grade(2);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, grade]);

  const title = all ? "All decks" : (deck?.name ?? "Study");
  const remaining = queue?.length ?? 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4">
        <Link href={exitHref} className="btn btn-ghost -ml-2 size-10 p-0" aria-label="End session">
          <CloseIcon />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
        {current && (
          <p className="text-sm text-muted tabular-nums">
            {remaining} left
          </p>
        )}
      </header>
      {current && queue && (
        <div className="mx-auto h-0.5 w-full max-w-2xl px-4">
          <div className="h-full overflow-hidden rounded-full bg-soft">
            <div
              className="h-full bg-fg/60 transition-all duration-300"
              style={{ width: `${(reviewed / (reviewed + remaining)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!ready || queue === null ? null : !current ? (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-4xl">✓</p>
          <p className="mt-2 text-xl font-semibold">{reviewed ? "Session complete" : "Nothing to study"}</p>
          <p className="text-muted">
            {reviewed
              ? `You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. Come back later for more.`
              : "No cards are due right now."}
          </p>
          <Link href={exitHref} className="btn btn-primary mt-6 px-8">
            Done
          </Link>
        </div>
      ) : (
        <>
          <div
            onClick={() => setRevealed(true)}
            className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 py-6"
          >
            <div className="panel my-auto flex w-full flex-col p-6 sm:p-10">
              {isNew(current) && <span className="mb-4 self-center text-xs font-medium text-easy uppercase">New</span>}
              <p className="text-center text-xl leading-relaxed break-words whitespace-pre-wrap sm:text-2xl">{current.front}</p>
              {revealed && (
                <>
                  <hr className="my-6 border-line" />
                  <p className="text-center text-xl leading-relaxed break-words whitespace-pre-wrap text-fg/85 sm:text-2xl">
                    {current.back}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl px-4 pt-2 pb-4">
            {revealed ? (
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map(({ grade: g, label, color }) => (
                  <button key={g} onClick={() => grade(g)} className="btn btn-outline h-16 flex-col gap-0.5 px-1">
                    <span className={`text-[15px] ${color}`}>{label}</span>
                    <span className="text-xs font-normal text-muted">{previewInterval(current, g)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setRevealed(true)} className="btn btn-primary h-16 w-full text-base">
                Show answer
              </button>
            )}
            <p className="mt-3 hidden text-center text-xs text-muted sm:block">
              {revealed ? "Keys 1–4 to grade · Space for Good" : "Space to reveal"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
