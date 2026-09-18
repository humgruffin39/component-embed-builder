"use client";

import { Field, TextInput, Toggle } from "@/components/ui/Field";
import { LIMITS } from "@/lib/constants";
import type { GalleryItemNode, ThumbnailNode } from "@/lib/document";
import { useBuilder } from "@/store/builder";

interface MediaInspectorProps {
  node: ThumbnailNode | GalleryItemNode;
  /** Media galleries take video as well; thumbnails are images only. */
  video?: boolean;
}

export const MediaInspector = ({ node, video }: MediaInspectorProps) => {
  const updateNode = useBuilder((state) => state.updateNode);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Source URL" hint={video ? "Image or video" : "Image only"}>
        {(id) => (
          <TextInput
            id={id}
            value={node.url}
            spellCheck={false}
            placeholder="https://example.com/hero.png"
            maxLength={LIMITS.mediaUrl}
            onChange={(event) => updateNode(node.id, { url: event.target.value })}
          />
        )}
      </Field>

      <Field
        label="Alt text"
        hint={`${node.description.length}/${LIMITS.mediaDescription}`}
      >
        {(id) => (
          <TextInput
            id={id}
            value={node.description}
            maxLength={LIMITS.mediaDescription}
            onChange={(event) =>
              updateNode(node.id, { description: event.target.value })
            }
          />
        )}
      </Field>

      <Toggle
        label="Hide behind a spoiler"
        checked={node.spoiler}
        onChange={(spoiler) => updateNode(node.id, { spoiler })}
      />
    </div>
  );
};
