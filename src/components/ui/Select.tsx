// src/components/ui/Select.tsx
import React from "react";
import clsx from "clsx";

type OptionValue = string | number;

export interface SelectOption<T extends OptionValue = string> {
  label: string;
  value: T;
}

interface SelectProps<T extends OptionValue = string>
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "onChange" | "value"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
}

export default function Select<T extends OptionValue = string>({
  label,
  error,
  helperText,
  options = [],
  value,
  onChange,
  className,
  ...rest
}: SelectProps<T>) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value;
    // On laisse la valeur sous forme de string, ou tu peux caster si tu sais que T = number
    onChange?.(raw as T);
  };

  const selectClasses = clsx(
    "select select-bordered w-full",
    error && "select-error",
    className
  );

  return (
    <div className="form-control w-full gap-1">
      {label && (
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
      )}

      <select
        className={selectClasses}
        value={value ?? ""}
        onChange={handleChange}
        {...rest}
      >
        {/* Option vide par défaut si aucune valeur sélectionnée */}
        <option value="" disabled>
          Sélectionner…
        </option>

        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {(helperText || error) && (
        <span
          className={clsx(
            "text-xs mt-0.5",
            error ? "text-error" : "text-slate-500"
          )}
        >
          {error ?? helperText}
        </span>
      )}
    </div>
  );
}
