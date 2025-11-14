// src/components/ui/Badge.tsx
import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Badge pour afficher un statut, une étiquette ou un rôle.
 */
export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-full";

  const sizes: Record<NonNullable<BadgeProps["size"]>, string> = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default:
      "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
    success:
      "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
    danger: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    outline:
      "border border-slate-300 text-slate-800 bg-transparent dark:border-slate-600 dark:text-slate-100",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
}
