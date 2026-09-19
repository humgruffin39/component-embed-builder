"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Shown beside the title, for a count or the thing being edited. */
  detail?: string;
  /** Read out after the title. Falls back to the detail line. */
  description?: string;
  children: ReactNode;
  className?: string;
}

/** A panel that comes up from the bottom edge, where the thumb already is. */
export const Sheet = ({
  open,
  onOpenChange,
  title,
  detail,
  description,
  children,
  className,
}: SheetProps) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=closed]:animate-[fade-out_150ms_ease-out] data-[state=open]:animate-[fade-in_180ms_ease-out]" />
      <Dialog.Content
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col rounded-t-2xl bg-panel shadow-float outline-none",
          "data-[state=closed]:animate-[sheet-out_180ms_ease-in] data-[state=open]:animate-[sheet-in_240ms_cubic-bezier(0.32,0.72,0,1)]",
          className,
        )}
      >
        <Dialog.Close
          aria-label="Close"
          className="flex shrink-0 cursor-pointer flex-col items-center py-3"
        >
          <span aria-hidden className="h-1 w-9 rounded-full bg-line-strong" />
        </Dialog.Close>

        <div className="flex shrink-0 items-center gap-2 px-4 pb-1">
          <Dialog.Title className="text-[14px] font-semibold text-fg">
            {title}
          </Dialog.Title>
          {detail && (
            <span className="min-w-0 truncate text-[12px] text-faint">
              {detail}
            </span>
          )}
          <Dialog.Close className="-mr-2 ml-auto flex h-11 items-center rounded-md px-3 text-[13px] font-medium text-muted transition-colors hover:bg-selected hover:text-fg">
            Done
          </Dialog.Close>
        </div>

        <Dialog.Description className="sr-only">
          {description ?? detail ?? `${title} panel`}
        </Dialog.Description>

        <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
