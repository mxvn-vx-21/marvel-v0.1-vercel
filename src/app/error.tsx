"use client";

// Generic boundary: never renders error.message or stack (they may contain DB details).
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-5 text-center">
      <main id="main">
        <h1 className="font-display text-4xl uppercase">Something broke</h1>
        <p className="mt-3 text-zinc-400">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-lg bg-hero px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide shadow-[3px_3px_0_#ffd400]">Try again</button>
      </main>
    </div>
  );
}
