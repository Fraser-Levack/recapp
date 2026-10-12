"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "./DataProvider";
import { CheckIcon } from "./icons";

const NEW_DECK = "__new__";

export type CardValues = { deckId: string; front: string; back: string; reverse: boolean };

type Props = {
  mode: "add" | "edit";
  initial: { deckId: string; front: string; back: string };
  onSubmit: (values: CardValues) => void;
  children?: React.ReactNode;
};

export function CardForm({ mode, initial, onSubmit, children }: Props) {
  const { decks, createDeck } = useData();
  const [deckId, setDeckId] = useState(initial.deckId || (decks.length ? decks[0].id : NEW_DECK));
  const [newDeckName, setNewDeckName] = useState("");
  const [front, setFront] = useState(initial.front);
  const [back, setBack] = useState(initial.back);
  const [reverse, setReverse] = useState(false);
  const [added, setAdded] = useState(0);
  const frontRef = useRef<HTMLTextAreaElement>(null);

  const creatingDeck = deckId === NEW_DECK;
  const canSave = (creatingDeck ? newDeckName.trim() : deckId) && front.trim() && back.trim();

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(0), 1800);
    return () => clearTimeout(t);
  }, [added]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSave) return;
    let targetDeck = deckId;
    if (creatingDeck) {
      targetDeck = createDeck(newDeckName).id;
      setDeckId(targetDeck);
      setNewDeckName("");
    }
    onSubmit({ deckId: targetDeck, front: front.trim(), back: back.trim(), reverse });
    if (mode === "add") {
      setFront("");
      setBack("");
      setAdded((n) => n + 1);
      // Focusing synchronously inside the submit handler keeps the mobile keyboard open.
      frontRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
  }

  return (
    <form onSubmit={submit} onKeyDown={onKeyDown} className="space-y-5">
      <div>
        <label className="label" htmlFor="deck">
          Deck
        </label>
        <select id="deck" className="input select" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
          <option value={NEW_DECK}>+ New deck…</option>
        </select>
        {creatingDeck && (
          <input
            className="input mt-2"
            placeholder="New deck name"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            maxLength={200}
            autoFocus={decks.length > 0}
          />
        )}
      </div>

      <div>
        <label className="label" htmlFor="front">
          Front
        </label>
        <textarea
          id="front"
          ref={frontRef}
          className="input min-h-28 resize-none [field-sizing:content]"
          placeholder="Question or prompt"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          autoFocus={mode === "add" && decks.length > 0}
          maxLength={10000}
          autoCapitalize="sentences"
        />
      </div>

      <div>
        <label className="label" htmlFor="back">
          Back
        </label>
        <textarea
          id="back"
          className="input min-h-28 resize-none [field-sizing:content]"
          placeholder="Answer"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          maxLength={10000}
          autoCapitalize="sentences"
        />
      </div>

      {mode === "add" && (
        <label className="flex items-center gap-3 text-sm text-muted select-none">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
          />
          Also add reversed card (back → front)
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary flex-1 sm:flex-none sm:px-8" disabled={!canSave}>
          {mode === "add" ? "Add card" : "Save"}
        </button>
        {children}
        {added > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-good" role="status">
            <CheckIcon width={16} height={16} /> Added
          </span>
        )}
      </div>
      <p className="hidden text-xs text-muted sm:block">Tip: press Ctrl/⌘ + Enter to save.</p>
    </form>
  );
}
