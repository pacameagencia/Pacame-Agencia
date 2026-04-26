import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Cargando…"
      className={cn("animate-pulse bg-sand-200/70 rounded-sm", className)}
      {...props}
    />
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-3 py-3 border-b border-ink/10">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-paper border-2 border-ink/10 p-5 space-y-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}
