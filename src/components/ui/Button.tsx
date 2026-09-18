"use client";

import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { CONTROL_HEIGHT } from "@/components/ui/control";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-fg text-bg hover:opacity-85 disabled:opacity-40 border border-transparent",
  secondary:
    "border border-line bg-bg text-fg hover:border-line-strong disabled:opacity-40",
  ghost: "border border-transparent text-muted hover:bg-selected hover:text-fg",
  danger: "border border-transparent text-danger hover:bg-selected",
};

/** Both sizes stand at CONTROL_HEIGHT; only the padding and type size differ. */
const SIZES: Record<Size, string> = {
  sm: "gap-1.5 px-2.5 text-[13px]",
  md: "gap-2 px-3.5 text-[13px]",
};

export const Button = ({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={clsx(
      "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-[opacity,background,border] disabled:cursor-not-allowed",
      CONTROL_HEIGHT,
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...props}
  />
);
