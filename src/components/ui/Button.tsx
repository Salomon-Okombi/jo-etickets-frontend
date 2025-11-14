// src/components/ui/Button.tsx
import React from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonTone = "default" | "danger" | "success";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  tone = "default",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base = "btn inline-flex items-center justify-center gap-2";

  const variants: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
  };

  const tones: Record<ButtonTone, string> = {
    default: "",
    danger: "btn-error",
    success: "btn-success",
  };

  const sizes: Record<ButtonSize, string> = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  const classes = clsx(
    base,
    variants[variant],
    tones[tone],
    sizes[size],
    fullWidth && "w-full",
    loading && "btn-disabled",
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="loading loading-spinner loading-xs" aria-hidden="true" />
      )}
      <span>{children}</span>
    </button>
  );
}
