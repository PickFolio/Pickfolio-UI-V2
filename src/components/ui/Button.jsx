import * as React from "react";
import { cn } from "@/lib/utils";

const variantClass = {
  default: "btn-primary",
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-secondary",
  destructive: "btn-danger",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

const sizeClass = {
  default: "",
  sm: "btn-sm",
  lg: "",
  icon: "icon-btn",
};

const Button = React.forwardRef(({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
  const isIcon = size === "icon";
  return (
    <button
      ref={ref}
      type={type}
      className={cn(isIcon ? sizeClass.icon : "btn", !isIcon && variantClass[variant], !isIcon && sizeClass[size], className)}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };
