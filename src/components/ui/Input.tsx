// src/components/ui/Input.tsx
import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

/**
 * ✅ Champ de saisie réutilisable
 * Exemple :
 * <Input label="Email" type="email" placeholder="ex: user@mail.com" />
 */
export default function Input({
  label,
  error,
  fullWidth = true,
  className,
  ...props
}: InputProps) {
  const id = React.useId();

  return (
    <div className={clsx("flex flex-col gap-1", fullWidth && "w-full")}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={clsx(
          "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400",
          error && "border-red-500 focus:border-red-500 focus:ring-red-200",
          className
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
