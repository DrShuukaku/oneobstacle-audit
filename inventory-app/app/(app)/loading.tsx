export default function Loading() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-40 rounded bg-stone-200" />
      <div className="h-24 rounded-xl bg-stone-200/70" />
      <div className="h-40 rounded-xl bg-stone-200/70" />
    </div>
  );
}
