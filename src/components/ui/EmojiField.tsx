"use client";

import { useState } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { EmojiIcon } from "@/components/ui/icons";
import { CONTROL_HEIGHT } from "@/components/ui/control";
import { Popover } from "@/components/ui/Popover";

const EmojiPickerPanel = dynamic(
  () => import("@/components/ui/EmojiPickerPanel"),
  {
    ssr: false,
    // The same height as the picker, so opening it settles in one step.
    loading: () => <div className="h-72" />,
  },
);

interface EmojiFieldProps {
  value: string;
  onChange: (emoji: string) => void;
}

export const EmojiField = ({ value, onChange }: EmojiFieldProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover
        open={open}
        onOpenChange={setOpen}
        align="start"
        width={300}
        trigger={
          <button
            type="button"
            aria-label="Choose an emoji"
            className={clsx(
              // Square, so the padding round the glyph is the same on every side.
              "flex aspect-square items-center justify-center rounded-md border border-line bg-bg text-base shadow-raised transition-colors hover:border-line-strong",
              CONTROL_HEIGHT,
            )}
          >
            {value || <EmojiIcon size={16} ariaHidden className="text-faint" />}
          </button>
        }
      >
        <EmojiPickerPanel
          onSelect={(emoji) => {
            onChange(emoji);
            setOpen(false);
          }}
        />
      </Popover>

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-[12px] text-faint transition-colors hover:text-fg"
        >
          Clear
        </button>
      )}
    </div>
  );
};
