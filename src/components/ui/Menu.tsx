"use client";

import type { ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "center" | "end";
}

export const Menu = ({ trigger, items, align = "start" }: MenuProps) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={4}
        className="z-50 min-w-44 rounded-lg border border-line bg-panel p-1 shadow-xl shadow-black/20 outline-none data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[scale-in_120ms_ease-out]"
      >
        {items.map((entry) => (
          <DropdownMenu.Item
            key={entry.label}
            disabled={entry.disabled}
            onSelect={entry.onSelect}
            className="cursor-pointer rounded px-2 py-1.5 text-[13px] text-muted outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-selected data-highlighted:text-fg"
          >
            {entry.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);
