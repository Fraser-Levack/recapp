"use client";

import { useParams, useRouter } from "next/navigation";
import { CardForm } from "@/components/CardForm";
import { useData } from "@/components/DataProvider";
import { BackLink, Loading } from "@/components/ui";

export default function EditCardPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, cards, updateCard, deleteCard } = useData();
  const router = useRouter();

  if (!ready) return <Loading />;
  const card = cards.find((c) => c.id === id);
  if (!card) {
    return (
      <div className="space-y-4">
        <BackLink href="/" label="Decks" />
        <p className="text-muted">This card doesn&apos;t exist anymore.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href={`/deck/${card.deckId}`} label="Back to deck" />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit card</h1>
      </div>
      <CardForm
        mode="edit"
        initial={card}
        onSubmit={({ deckId, front, back }) => {
          updateCard({ ...card, deckId, front, back });
          router.push(`/deck/${deckId}`);
        }}
      >
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (!confirm("Delete this card?")) return;
            deleteCard(card.id);
            router.push(`/deck/${card.deckId}`);
          }}
        >
          Delete
        </button>
      </CardForm>
    </div>
  );
}
