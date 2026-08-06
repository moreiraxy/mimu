import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, id, className, rows = 3, ...props }, ref) => {
    const textareaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-neutro-muted"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "resize-none rounded-button border border-neutro-border bg-fundo px-3.5 py-3 text-sm text-escuro placeholder:text-neutro-muted",
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

Textarea.displayName = "Textarea";
