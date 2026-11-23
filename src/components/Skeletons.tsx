export function CarouselSkeleton() {
  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[560px] bg-[#1C0A0C] overflow-hidden animate-pulse">
      <div className="mx-auto max-w-7xl h-full px-6 flex flex-col justify-end pb-14">
        <div className="h-4 w-32 rounded bg-red-900/70" />
        <div className="mt-3 h-10 w-2/3 max-w-xl rounded bg-red-900/70" />
        <div className="mt-3 h-4 w-1/2 max-w-md rounded bg-red-900/50" />
        <div className="mt-6 h-11 w-36 rounded-lg bg-yellow-400/40" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden animate-pulse">
      <div className="aspect-[4/3] w-full bg-slate-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-4 w-4/5 rounded bg-slate-200" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-5 w-20 rounded bg-slate-200" />
          <div className="h-4 w-14 rounded bg-slate-100" />
        </div>
        <div className="h-3 w-3/5 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-4 w-48 rounded bg-slate-200 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-2xl bg-slate-100" />
          <div className="flex gap-3">
            <div className="h-20 w-24 rounded-xl bg-slate-100" />
            <div className="h-20 w-24 rounded-xl bg-slate-100" />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-5">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-9 w-4/5 rounded bg-slate-200" />
          <div className="h-7 w-40 rounded bg-slate-200" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-10 rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="h-12 w-full rounded-xl bg-slate-200 mt-6" />
        </div>
      </div>
    </div>
  );
}
