export type Deck = {
  id: string;
  name: string;
  createdAt: number;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  /** Ease factor (SM-2). Starts at 2.5, never below 1.3. */
  ease: number;
  /** Current interval in days. 0 means the card is new or in learning. */
  interval: number;
  reps: number;
  lapses: number;
  /** Epoch ms when the card is next due. */
  due: number;
  /** Epoch ms of the last review, or null if never reviewed. */
  lastReview: number | null;
  createdAt: number;
  updatedAt: number;
};

/** 0 = Again, 1 = Hard, 2 = Good, 3 = Easy */
export type Grade = 0 | 1 | 2 | 3;
