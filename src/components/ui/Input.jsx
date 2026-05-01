import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type = "text", error, ...props }, ref) => {
  return (
    <input
      type={type}
      aria-invalid={error ? "true" : undefined}
      className={cn("field-control", className)}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
