"use client";

import { Field, TextArea } from "@/components/ui/Field";
import { MarkdownMark } from "@/components/ui/stackIcons";
import type { TextDisplayNode } from "@/lib/document";
import { useBuilder } from "@/store/builder";

export const TextInspector = ({ node }: { node: TextDisplayNode }) => {
  const updateNode = useBuilder((state) => state.updateNode);

  return (
    <Field
      label="Content"
      mark={
        <span title="Markdown supported" className="flex text-faint">
          <MarkdownMark className="h-[11px] w-auto" />
        </span>
      }
      hint={`${node.content.length} chars`}
    >
      {(id) => (
        <TextArea
          id={id}
          rows={14}
          value={node.content}
          spellCheck={false}
          onChange={(event) =>
            updateNode(node.id, { content: event.target.value })
          }
        />
      )}
    </Field>
  );
};
