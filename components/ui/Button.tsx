import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-coral text-white hover:bg-coral-hover disabled:bg-neutro-disabled disabled:text-neutro-disabled-text",
  secondary:
    "bg-white text-coral border-[1.5px] border-coral disabled:border-neutro-disabled disabled:text-neutro-disabled-text",
  ghost: "bg-transparent text-coral hover:bg-coral-light",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-12 px-[22px] text-sm",
  sm: "h-9 px-4 text-[13px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-button font-bold transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
