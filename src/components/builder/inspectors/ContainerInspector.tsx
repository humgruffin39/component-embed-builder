"use client";

import { Field, TextInput, Toggle } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { ContainerNode } from "@/lib/document";
import { useBuilder } from "@/store/builder";

const PRESETS = [0x5865f2, 0x57f287, 0xfee75c, 0xed4245, 0xeb459e, 0x1abc9c];

const toHex = (color: number | null) =>
  color === null ? "" : `#${color.toString(16).padStart(6, "0")}`;

const fromHex = (value: string): number | null => {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return match ? Number.parseInt(match[1], 16) : null;
};

export const ContainerInspector = ({ node }: { node: ContainerNode }) => {
  const updateNode = useBuilder((state) => state.updateNode);
  const setAccent = (accentColor: number | null) =>
    updateNode(node.id, { accentColor });

  return (
    <div className="flex flex-col gap-4">
      <Field label="Accent colour" hint="Also sets theme-color">
        {(id) => (
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Accent colour"
              value={toHex(node.accentColor) || "#5865f2"}
              onChange={(event) => setAccent(fromHex(event.target.value))}
              className="size-8 shrink-0 cursor-pointer rounded-md border border-line bg-bg"
            />
            <TextInput
              id={id}
              value={toHex(node.accentColor)}
              placeholder="none"
              spellCheck={false}
              onChange={(event) => setAccent(fromHex(event.target.value))}
              className="font-mono"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAccent(null)}
              disabled={node.accentColor === null}
            >
              Clear
            </Button>
          </div>
        )}
      </Field>

      <div className="flex gap-1.5">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={toHex(color)}
            onClick={() => setAccent(color)}
            style={{ background: toHex(color) }}
            className="size-6 rounded-md border border-line"
          />
        ))}
      </div>

      <Toggle
        label="Blur the whole embed as a spoiler"
        checked={node.spoiler}
        onChange={(spoiler) => updateNode(node.id, { spoiler })}
      />
    </div>
  );
};
