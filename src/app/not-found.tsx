import Link from "next/link";

export const metadata = { title: "Page not found — MARVEL.WTF", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <main id="main" className="relative text-center">
        <p className="font-display text-sm uppercase tracking-[.3em] text-spark">404</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">Page<br /><span className="text-hero [text-shadow:4px_4px_0_#ffd400]">not found</span></h1>
        <p className="mx-auto mt-5 max-w-sm text-zinc-400">This page doesn&apos;t exist.</p>
        <Link href="/" className="mt-8 inline-block rounded-lg bg-hero px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide shadow-[3px_3px_0_#ffd400]">Back home</Link>
      </main>
    </div>
  );
}
