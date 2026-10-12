"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "./DataProvider";
import { DecksIcon, PlusIcon, UserIcon } from "./icons";

const tabs = [
  { href: "/", label: "Decks", Icon: DecksIcon },
  { href: "/add", label: "Add", Icon: PlusIcon },
  { href: "/account", label: "Account", Icon: UserIcon },
];

export function Nav() {
  const path = usePathname();
  const { user, cloudEnabled } = useData();

  const isActive = (href: string) =>
    href === "/" ? path === "/" || path.startsWith("/deck") || path.startsWith("/cards") : path.startsWith(href);

  // The add screen keeps the bottom bar out of the way of the on-screen keyboard.
  const showBottomBar = !path.startsWith("/add");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-fg">
              <DecksIcon width={16} height={16} />
            </span>
            RecApp
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {tabs.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  isActive(href) ? "bg-soft text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {cloudEnabled && (
            <Link href="/account" className="text-xs text-muted sm:hidden">
              {user ? "Synced" : "Local only"}
            </Link>
          )}
        </div>
      </header>

      {showBottomBar && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
          <div className="mx-auto grid h-16 max-w-md grid-cols-3">
            {tabs.map(({ href, label, Icon }) =>
              href === "/add" ? (
                <Link key={href} href={href} aria-label="Add card" className="grid place-items-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-fg shadow-sm transition active:scale-95">
                    <Icon width={22} height={22} strokeWidth={2.2} />
                  </span>
                </Link>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] transition ${
                    isActive(href) ? "text-fg" : "text-muted"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              ),
            )}
          </div>
        </nav>
      )}
    </>
  );
}
