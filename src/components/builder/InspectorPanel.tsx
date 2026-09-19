"use client";

import { ComponentType } from "@/lib/constants";
import type { ContainerNode } from "@/lib/document";
import { findNode, isComponentNode, labelForNode } from "@/lib/tree";
import { useBuilder } from "@/store/builder";
import { ButtonInspector } from "@/components/builder/inspectors/ButtonInspector";
import { ContainerInspector } from "@/components/builder/inspectors/ContainerInspector";
import { MediaInspector } from "@/components/builder/inspectors/MediaInspector";
import { SeparatorInspector } from "@/components/builder/inspectors/SeparatorInspector";
import { TextInspector } from "@/components/builder/inspectors/TextInspector";

/**
 * Sections, galleries and action rows fold in the tree instead of opening
 * here, so the inspector only ever sees a leaf or the container.
 */
const ComponentEditor = ({ root }: { root: ContainerNode }) => {
  const selectedId = useBuilder((state) => state.selectedId);
  const node = findNode(root, selectedId ?? root.id) ?? root;

  if (!isComponentNode(node)) return <MediaInspector node={node} video />;

  switch (node.type) {
    case ComponentType.TextDisplay:
      return <TextInspector node={node} />;
    case ComponentType.Separator:
      return <SeparatorInspector node={node} />;
    case ComponentType.Thumbnail:
      return <MediaInspector node={node} />;
    case ComponentType.Button:
      return <ButtonInspector node={node} />;
    default:
      return <ContainerInspector node={root} />;
  }
};

export const InspectorPanel = ({
  root,
  hideHeader = false,
}: {
  root: ContainerNode;
  /** A sheet titles itself, so the panel's own header would repeat it. */
  hideHeader?: boolean;
}) => {
  const selectedId = useBuilder((state) => state.selectedId);

  return (
    <div className="flex h-full flex-col">
      {!hideHeader && (
        <div className="flex h-12 items-center border-b border-line px-3">
          <h2 className="truncate text-[13px] font-medium">
            {labelForNode(root, selectedId)}
          </h2>
        </div>
      )}

      <div className="scroll-area flex-1 overflow-y-auto p-3">
        <ComponentEditor root={root} />
      </div>
    </div>
  );
};
