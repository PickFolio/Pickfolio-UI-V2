import { cn } from "@/lib/utils";

const toneClass = {
  neutral: "",
  live: "badge-live",
  success: "badge-success",
  warning: "badge-warning",
};

export function Badge({ children, tone = "neutral", className }) {
  return <span className={cn("badge", toneClass[tone], className)}>{children}</span>;
}
