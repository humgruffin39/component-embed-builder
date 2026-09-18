"use client";

import { EmojiField } from "@/components/ui/EmojiField";
import { Field, TextInput } from "@/components/ui/Field";
import { LIMITS } from "@/lib/constants";
import type { ButtonNode } from "@/lib/document";
import { useBuilder } from "@/store/builder";

export const ButtonInspector = ({ node }: { node: ButtonNode }) => {
  const updateNode = useBuilder((state) => state.updateNode);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Label" hint={`${node.label.length}/${LIMITS.buttonLabel}`}>
        {(id) => (
          <TextInput
            id={id}
            value={node.label}
            maxLength={LIMITS.buttonLabel}
            onChange={(event) =>
              updateNode(node.id, { label: event.target.value })
            }
          />
        )}
      </Field>

      <Field label="URL">
        {(id) => (
          <TextInput
            id={id}
            value={node.url}
            spellCheck={false}
            placeholder="https://example.com"
            maxLength={LIMITS.buttonUrl}
            onChange={(event) => updateNode(node.id, { url: event.target.value })}
          />
        )}
      </Field>

      <Field label="Emoji">
        {() => (
          <EmojiField
            value={node.emoji}
            onChange={(emoji) => updateNode(node.id, { emoji })}
          />
        )}
      </Field>
    </div>
  );
};
