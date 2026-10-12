"use client";

import Link from "next/link";
import { useData } from "./DataProvider";
import { BackIcon, CloseIcon } from "./icons";

export function Loading() {
  return (
    <div className="space-y-3 pt-2" aria-busy>
      <div className="h-7 w-32 animate-pulse rounded-lg bg-soft" />
      <div className="h-36 animate-pulse rounded-2xl bg-soft" />
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:text-fg">
      <BackIcon width={16} height={16} />
      {label}
    </Link>
  );
}

export function Notice({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-soft px-4 py-3 text-sm">
      <p className="flex-1 text-muted">{children}</p>
      {action}
    </div>
  );
}

export function ErrorToast() {
  const { error, clearError } = useData();
  if (!error) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl bg-accent px-4 py-3 text-sm text-accent-fg shadow-lg sm:bottom-6"
    >
      <p className="flex-1">{error}</p>
      <button onClick={clearError} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        <CloseIcon width={18} height={18} />
      </button>
    </div>
  );
}

export function Counts({ due, fresh }: { due: number; fresh: number }) {
  if (!due && !fresh) return <span className="text-sm text-muted/70">Done</span>;
  return (
    <span className="flex gap-3 text-sm tabular-nums">
      {fresh > 0 && <span className="text-easy" title="New">{fresh} new</span>}
      {due > 0 && <span className="text-good" title="Due">{due} due</span>}
    </span>
  );
}
