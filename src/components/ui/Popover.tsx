"use client";

import type { ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  width?: number;
}

export const Popover = ({
  trigger,
  children,
  open,
  onOpenChange,
  align = "end",
  width = 340,
}: PopoverProps) => (
  <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={6}
        style={{ width }}
        className="z-50 rounded-xl border border-line bg-panel p-3 text-fg shadow-xl shadow-black/20 outline-none data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_140ms_ease-out]"
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>
);
