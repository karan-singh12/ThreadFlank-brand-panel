/** Placeholder shown while a search-param–dependent form hydrates. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="h-11 w-3/4 rounded-lg bg-white/8" />
      <div className="mt-4 h-5 w-full rounded bg-white/5" />
      <div className="mt-10 flex flex-col gap-6">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-20 rounded bg-white/8" />
            <div className="h-[52px] rounded-xl bg-white/5" />
          </div>
        ))}
        <div className="mt-2 h-[52px] rounded-full bg-accent/25" />
      </div>
    </div>
  );
}
