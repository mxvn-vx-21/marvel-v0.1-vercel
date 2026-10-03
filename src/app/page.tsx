import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/ui";
import { Alert } from "@/components/ui";

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-4 text-sm font-bold uppercase tracking-wide">
          {user ? (
            <Link href="/dashboard" className="rounded-lg bg-hero px-4 py-2 text-white shadow-[3px_3px_0_#ffd400]">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-300 hover:text-white">Log in</Link>
              <Link href="/signup" className="rounded-lg bg-hero px-4 py-2 text-white shadow-[3px_3px_0_#ffd400]">Sign up</Link>
            </>
          )}
        </nav>
      </header>

      <main id="main" className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-24 pt-16 text-center sm:pt-24">
        {sp.deleted && <div className="mb-8 w-full max-w-md"><Alert kind="success">Your account has been deleted.</Alert></div>}
        <p className="mb-4 rounded-full border border-spark/50 px-3 py-1 text-xs font-bold uppercase tracking-[.25em] text-spark">V0 · Foundation</p>
        <h1 className="font-display text-5xl uppercase leading-[.95] tracking-tight sm:text-7xl">
          Become the<br /><span className="text-hero [text-shadow:4px_4px_0_#ffd400]">character.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-400">
          Claim your name. Build a hero-grade identity page. Share one link — <span className="font-bold text-white">marvel.wtf/you</span>.
        </p>

        <form action="/signup" method="get" className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="claim" className="sr-only">Choose your username</label>
          <div className="flex flex-1 items-center rounded-lg border-2 border-line bg-panel focus-within:border-spark">
            <span className="select-none pl-3 text-sm text-zinc-500">marvel.wtf/</span>
            <input id="claim" name="username" placeholder="yourname" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={20}
              className="w-full bg-transparent px-1 py-3 text-white outline-none placeholder:text-zinc-600 focus-visible:outline-none" />
          </div>
          <button className="rounded-lg bg-hero px-6 py-3 font-extrabold uppercase tracking-wide text-white shadow-[4px_4px_0_#ffd400] transition active:translate-x-px active:translate-y-px active:shadow-none">Claim it</button>
        </form>
      </main>
    </div>
  );
}
