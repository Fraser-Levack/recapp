import type { Card, Grade } from "./types";

const MINUTE = 60_000;
const MIN_EASE = 1.3;

export const NEW_CARDS_PER_SESSION = 20;

export const isNew = (card: Card) => card.lastReview === null;

/** Midnight (local time) `days` days from `now`. */
function startOfDayPlus(now: number, days: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/**
 * A simplified SM-2 scheduler, close to Anki's defaults:
 * - Learning cards (interval 0): Again → 1m, Hard → 6m, Good → 1d, Easy → 4d.
 * - Review cards grow by the ease factor; Again sends them back to learning.
 */
export function schedule(card: Card, grade: Grade, now = Date.now()): Card {
  const { reps } = card;
  let { ease, interval, lapses } = card;
  const learning = interval === 0;
  const base = { ...card, lastReview: now, updatedAt: now };

  if (grade === 0) {
    if (!learning) lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    return { ...base, ease, interval: 0, reps: 0, lapses, due: now + MINUTE };
  }

  if (learning) {
    if (grade === 1) return { ...base, due: now + 6 * MINUTE };
    interval = grade === 2 ? 1 : 4;
  } else {
    // Each grade is strictly longer than the one below it, even for short intervals.
    const hard = Math.max(interval + 1, Math.round(interval * 1.2));
    const good = Math.max(hard + 1, Math.round(interval * ease));
    const easy = Math.max(good + 1, Math.round(interval * ease * 1.3));
    interval = [hard, good, easy][grade - 1];
    if (grade === 1) ease = Math.max(MIN_EASE, ease - 0.15);
    if (grade === 3) ease += 0.15;
  }

  return {
    ...base,
    ease,
    interval,
    reps: reps + 1,
    lapses,
    due: startOfDayPlus(now, interval),
  };
}

/** Human-readable time until the card would be due after `grade`, e.g. "10m", "3d", "2mo". */
export function previewInterval(card: Card, grade: Grade, now = Date.now()) {
  const next = schedule(card, grade, now);
  if (next.interval === 0) return `${Math.round((next.due - now) / MINUTE)}m`;
  const days = next.interval;
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, "")}y`;
}

export function deckStats(cards: Card[], now = Date.now()) {
  let fresh = 0;
  let due = 0;
  for (const c of cards) {
    if (isNew(c)) fresh += 1;
    else if (c.due <= now) due += 1;
  }
  return { total: cards.length, new: Math.min(fresh, NEW_CARDS_PER_SESSION), due };
}

/** Due review/learning cards first (oldest due first), then up to N new cards. */
export function buildQueue(cards: Card[], now = Date.now()) {
  const due = cards.filter((c) => !isNew(c) && c.due <= now).sort((a, b) => a.due - b.due);
  const fresh = cards
    .filter(isNew)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, NEW_CARDS_PER_SESSION);
  return [...due, ...fresh].map((c) => c.id);
}

/** Cards due again within this window are re-shown in the same session. */
export const RELEARN_WINDOW = 20 * MINUTE;
