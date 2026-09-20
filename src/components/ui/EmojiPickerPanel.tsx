"use client";

import clsx from "clsx";
import { EmojiPicker } from "frimousse";
import { CONTROL_HEIGHT } from "@/components/ui/control";

/**
 * Kept apart from the field so the picker's emoji data is fetched the first
 * time someone opens it rather than on page load.
 */
export default function EmojiPickerPanel({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  return (
    <EmojiPicker.Root
      className="flex h-72 flex-col gap-1.5"
      // Left to itself the picker asks the browser what it can draw, and the
      // answer comes back yes for everything, so it offers the newest emoji
      // there are. The ones Windows has no glyph for then come apart into
      // their pieces: a walking person next to a blue arrow, a bird next to a
      // black square. Emoji 14 is the newest set every current platform draws.
      emojiVersion={14}
      // Pinned, because naming a version otherwise sends it to a dataset of
      // that number instead.
      emojibaseUrl="https://cdn.jsdelivr.net/npm/emojibase-data@latest"
      onEmojiSelect={({ emoji }) => onSelect(emoji)}
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
  );
}
