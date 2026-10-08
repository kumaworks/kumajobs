export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat halaman"
      className="space-y-8 motion-safe:animate-pulse"
    >
      <div className="h-60 rounded-3xl bg-muted" />
      <div className="h-24 rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-3xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Memuat halaman…</span>
    </div>
  );
}
