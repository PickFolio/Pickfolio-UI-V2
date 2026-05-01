import { cn } from "@/lib/utils";

export function Skeleton({ className, style }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} style={style} />;
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="card card-pad stack">
      <Skeleton style={{ height: "1.5rem", width: "60%" }} />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} style={{ height: "3.25rem" }} />
      ))}
    </div>
  );
}
