export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-lg bg-white/[0.06] animate-shimmer" />
          <div className="h-5 w-80 rounded-lg bg-white/[0.04] animate-shimmer" />
        </div>
        <div className="h-12 w-40 rounded-xl bg-white/[0.06] animate-shimmer" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-[#1F2937] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/[0.06] animate-shimmer" />
              <div className="space-y-2 flex-1">
                <div className="h-8 w-16 rounded-md bg-white/[0.06] animate-shimmer" />
                <div className="h-3 w-28 rounded-md bg-white/[0.04] animate-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart skeleton */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-[#1F2937] p-6">
          <div className="h-5 w-48 rounded-md bg-white/[0.06] animate-shimmer mb-6" />
          <div className="h-40 rounded-xl bg-white/[0.04] animate-shimmer" />
        </div>

        {/* Activity skeleton */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#1F2937] p-6">
          <div className="h-5 w-36 rounded-md bg-white/[0.06] animate-shimmer mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.06] animate-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-md bg-white/[0.06] animate-shimmer" />
                  <div className="h-3 w-48 rounded-md bg-white/[0.04] animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
