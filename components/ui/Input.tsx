import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-neutro-muted"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "rounded-button border border-neutro-border bg-fundo px-3.5 py-3 text-sm text-escuro placeholder:text-neutro-muted",
            "outline-none transition-colors focus:border-coral focus:bg-superficie",
            className,
          )}
          {...props}
        />
        {helper && <p className="text-xs text-neutro-muted">{helper}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
