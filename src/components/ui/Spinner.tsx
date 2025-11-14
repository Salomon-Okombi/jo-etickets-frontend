// src/components/ui/Spinner.tsx
import React from "react";
import clsx from "clsx";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | number;

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
  const isNumber = typeof size === "number";

  const sizeClass =
    !isNumber &&
    {
      xs: "loading-xs",
      sm: "loading-sm",
      md: "loading-md",
      lg: "loading-lg",
    }[size];

  const style = isNumber
    ? ({
        width: size,
        height: size,
      } as React.CSSProperties)
    : undefined;

  return (
    <span
      className={clsx("loading loading-spinner", sizeClass, className)}
      style={style}
      aria-label="Chargement"
    />
  );
}
