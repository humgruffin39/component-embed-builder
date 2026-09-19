"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Field, Toggle } from "@/components/ui/Field";
import { Popover } from "@/components/ui/Popover";
import { toHex } from "@/lib/color";
import type { ContainerNode } from "@/lib/document";
import { useBuilder } from "@/store/builder";

/** The accent when there is none yet, so the picker opens somewhere sensible. */
const FALLBACK = 0x5865f2;

export const ContainerInspector = ({ node }: { node: ContainerNode }) => {
  const updateNode = useBuilder((state) => state.updateNode);
  const [open, setOpen] = useState(false);
  const setAccent = (accentColor: number | null) =>
    updateNode(node.id, { accentColor });

  const accent = node.accentColor;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Accent and theme colour">
        {() => (
          <div className="flex items-center gap-2">
            <Popover
              open={open}
              onOpenChange={setOpen}
              align="start"
              width={248}
              trigger={
                <button
                  type="button"
                  className="flex h-8 flex-1 items-center gap-2 rounded-md border border-line bg-bg pr-2.5 pl-1.5 text-left shadow-raised transition-colors hover:border-line-strong"
                >
                  <span
                    className="size-5 shrink-0 rounded border border-line"
                    style={{
                      background:
                        accent === null ? "transparent" : toHex(accent),
                    }}
                  />
                  <span className="text-[13px] text-fg">
                    {accent === null ? "None" : toHex(accent)}
                  </span>
                </button>
              }
            >
              <ColorPicker value={accent ?? FALLBACK} onChange={setAccent} />
            </Popover>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAccent(null)}
              disabled={accent === null}
            >
              Clear
            </Button>
          </div>
        )}
      </Field>

      <Toggle
        label="Blur the whole embed as a spoiler"
        checked={node.spoiler}
        onChange={(spoiler) => updateNode(node.id, { spoiler })}
      />
    </div>
  );
};
