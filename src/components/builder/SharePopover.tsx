"use client";

import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { CONTROL_HEIGHT } from "@/components/ui/control";
import { Field } from "@/components/ui/Field";
import { Popover } from "@/components/ui/Popover";

export const SharePopover = () => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  // The hash is written by the URL sync effect, so read it as the popover opens.
  const openWith = (next: boolean) => {
    if (next) setUrl(window.location.href);
    setOpen(next);
  };

  return (
    <Popover
      open={open}
      onOpenChange={openWith}
      width={360}
      trigger={
        <Button size="sm" variant="primary">
          Share
        </Button>
      }
    >
      <Field label="Share URL">
        {() => (
          <div
            className={clsx(
              "flex items-center gap-2 rounded-md border border-line bg-bg pr-1 pl-2.5",
              CONTROL_HEIGHT,
            )}
          >
            <span className="scroll-area min-w-0 flex-1 overflow-x-auto text-[13px] whitespace-nowrap text-muted">
              {url}
            </span>
            <CopyButton value={url} />
          </div>
        )}
      </Field>
    </Popover>
  );
};
