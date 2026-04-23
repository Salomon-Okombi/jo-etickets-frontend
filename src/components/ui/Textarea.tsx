// src/components/ui/Textarea.tsx
import { forwardRef, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, containerClassName, rows = 4, id, required, ...props }, ref) => {
    const inputId = id ?? (label ? `ta-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className={clsx("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={clsx(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none",
            "border-slate-300 text-slate-800 placeholder-slate-400",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-200",
            className
          )}
          {...props}
        />

        {hint && !error && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
