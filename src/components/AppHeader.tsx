import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { Logo } from "./ui";

export function AppHeader({ username }: { username: string | null }) {
  return (
    <header className="border-b border-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-bold uppercase tracking-wide sm:gap-3">
          <Link href="/dashboard" className="rounded px-2 py-1 text-zinc-300 hover:text-white">Dashboard</Link>
          <Link href="/settings" className="rounded px-2 py-1 text-zinc-300 hover:text-white">Settings</Link>
          {username && <Link href={`/${username}`} className="hidden rounded px-2 py-1 text-spark hover:underline sm:block">My page</Link>}
          <LogoutButton className="ml-1 !px-3 !py-1.5" />
        </nav>
      </div>
    </header>
  );
}
