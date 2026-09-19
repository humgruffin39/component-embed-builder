"use client";

import { useState } from "react";
import clsx from "clsx";
import { EmojiPicker } from "frimousse";
import { EmojiIcon } from "@/components/ui/icons";
import { CONTROL_HEIGHT } from "@/components/ui/control";
import { Popover } from "@/components/ui/Popover";

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
        <EmojiPicker.Root
          className="flex h-72 flex-col gap-1.5"
          onEmojiSelect={({ emoji }) => {
            onChange(emoji);
            setOpen(false);
          }}
        >
          <EmojiPicker.Search className={clsx(
            "w-full rounded-md border border-line bg-bg px-2.5 text-[13px] text-fg placeholder:text-faint focus:border-line-strong focus:outline-none",
            CONTROL_HEIGHT,
          )} />
          <EmojiPicker.Viewport className="scroll-area relative flex-1 outline-none">
            <EmojiPicker.Empty className="flex h-full items-center justify-center text-[13px] text-faint">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="pb-1 select-none"
              components={{
                // Opaque and sticky, so scrolling emoji pass behind it
                // rather than through the gap above it.
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="sticky top-0 z-10 bg-panel px-1 pt-1 pb-1 text-[11px] font-medium text-faint"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded text-xl data-active:bg-selected"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
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
