"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export const CopyButton = ({ value, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1_500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      disabled={copied}
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
      }}
      className={clsx(
        "relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-all duration-200 ease-out hover:text-fg active:scale-[0.97] disabled:pointer-events-none disabled:text-fg",
        className,
      )}
    >
      <span
        className={clsx(
          "transition-all duration-200",
          copied
            ? "scale-100 opacity-100 blur-none"
            : "scale-75 opacity-0 blur-[2px]",
        )}
      >
        <CheckIcon size={14} ariaHidden />
      </span>
      <span
        className={clsx(
          "absolute transition-all duration-200",
          copied
            ? "scale-0 opacity-0 blur-[2px]"
            : "scale-100 opacity-100 blur-none",
        )}
      >
        <CopyIcon size={14} ariaHidden />
      </span>
    </button>
  );
};
