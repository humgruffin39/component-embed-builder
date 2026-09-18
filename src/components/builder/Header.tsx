"use client";

import { CONTROL_HEIGHT } from "@/components/ui/control";
import { DOCS_URL } from "@/lib/constants";
import { ExternalIcon } from "@/components/ui/icons";
import { ImportPopover } from "@/components/builder/ImportPopover";
import { SharePopover } from "@/components/builder/SharePopover";

export const Header = () => (
  <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3">
    <h1 className="text-[13px] font-semibold tracking-tight">
      Component Embed Builder
    </h1>

    <div className="ml-auto flex items-center gap-1.5">
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`hidden ${CONTROL_HEIGHT} items-center gap-1 rounded-md px-2 text-[13px] text-muted transition-colors hover:bg-selected/40 hover:text-fg sm:inline-flex`}
      >
        Docs
        <ExternalIcon size={13} ariaHidden />
      </a>
      <ImportPopover />
      <SharePopover />
    </div>
  </header>
);
