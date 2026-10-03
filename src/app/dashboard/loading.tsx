export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10" role="status" aria-label="Loading dashboard">
      <div className="skeleton h-10 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-[32rem] lg:col-span-2" />
        <div className="space-y-6"><div className="skeleton h-56" /><div className="skeleton h-44" /></div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
