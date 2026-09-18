"use client";

import { ComponentType } from "@/lib/constants";
import type { ContainerNode } from "@/lib/document";
import { NODE_LABELS, findNode, findParent, isComponentNode } from "@/lib/tree";
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

const headingFor = (root: ContainerNode, selectedId: string | null): string => {
  const node = findNode(root, selectedId ?? root.id) ?? root;
  if (isComponentNode(node)) return NODE_LABELS[node.type];

  const parent = findParent(root, node.id);
  const index =
    parent && isComponentNode(parent) && parent.type === ComponentType.MediaGallery
      ? parent.items.findIndex((item) => item.id === node.id) + 1
      : 0;
  return `Gallery item ${index}`;
};

export const InspectorPanel = ({ root }: { root: ContainerNode }) => {
  const selectedId = useBuilder((state) => state.selectedId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center border-b border-line px-3">
        <h2 className="truncate text-[13px] font-medium">
          {headingFor(root, selectedId)}
        </h2>
      </div>

      <div className="scroll-area flex-1 overflow-y-auto p-3">
        <ComponentEditor root={root} />
      </div>
    </div>
  );
};
