export function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col gap-5 p-4 md:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted/70" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-xl bg-muted/70" />
        <div className="h-24 rounded-xl bg-muted/70" />
        <div className="h-24 rounded-xl bg-muted/70" />
      </div>
      <div className="h-64 rounded-2xl bg-muted/50" />
    </div>
  );
}
