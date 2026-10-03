export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10" role="status" aria-label="Loading settings">
      <div className="skeleton h-10 w-48" /><div className="skeleton h-48" /><div className="skeleton h-72" /><span className="sr-only">Loading…</span>
    </div>
  );
}
