"use client";

import { buttonClasses } from "@/components/ui/Button";
import { CONTROL_HEIGHT } from "@/components/ui/control";
import { ExternalIcon } from "@/components/ui/icons";
import { BrandMark } from "@/components/ui/stackIcons";
import { ImportPopover } from "@/components/builder/ImportPopover";
import { SharePopover } from "@/components/builder/SharePopover";
import { DOCS_URL, REPO_URL } from "@/lib/constants";

export const Header = () => (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4">
      <BrandMark className="size-5.5 shrink-0 rounded-sm" />
      <h1 className="hidden text-[13px] font-semibold tracking-tight sm:block">
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
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden sm:inline-flex ${buttonClasses("secondary", "sm")}`}
        >
          Source
        </a>
        <ImportPopover />
        <SharePopover />
      </div>
  </header>
);
