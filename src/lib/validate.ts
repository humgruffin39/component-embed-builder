import { ComponentType, LIMITS, MEDIA_FORMATS } from "@/lib/constants";
import type { ContainerNode, NodeId } from "@/lib/document";
import { toPayload } from "@/lib/document";
import { countComponents, isComponentNode, walk } from "@/lib/tree";

export type IssueLevel = "error" | "warning";

export interface Issue {
  level: IssueLevel;
  message: string;
  /** Node to select when the issue is clicked. Absent for document-wide issues. */
  nodeId?: NodeId;
}

const byteLength = (value: string): number =>
  new TextEncoder().encode(value).length;

const extensionOf = (url: string): string => {
  const path = url.split(/[?#]/, 1)[0];
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot + 1).toLowerCase();
};

interface MediaCheck {
  url: string;
  nodeId: NodeId;
  label: string;
  video: boolean;
}

const checkMedia = (
  { url, nodeId, label, video }: MediaCheck,
  issues: Issue[],
): void => {
  const value = url.trim();
  if (value.length === 0) {
    issues.push({ level: "error", nodeId, message: `${label} needs a URL.` });
    return;
  }
  if (!/^https?:\/\//i.test(value)) {
    issues.push({
      level: "error",
      nodeId,
      message: `${label} URL must start with http:// or https://.`,
    });
    return;
  }
  if (value.length > LIMITS.mediaUrl) {
    issues.push({
      level: "error",
      nodeId,
      message: `${label} URL exceeds ${LIMITS.mediaUrl} characters.`,
    });
  }
  if (value.startsWith("http://")) {
    issues.push({
      level: "warning",
      nodeId,
      message: `${label} URL uses http. Serve it over https.`,
    });
  }
  const allowed: readonly string[] = video
    ? [...MEDIA_FORMATS.image, ...MEDIA_FORMATS.video]
    : MEDIA_FORMATS.image;
  const extension = extensionOf(value);
  if (extension.length > 0 && !allowed.includes(extension)) {
    issues.push({
      level: "warning",
      nodeId,
      message: `${label} format .${extension} may not be supported (${allowed.join(", ")}).`,
    });
  }
};

const checkButton = (
  node: { id: NodeId; label: string; url: string; emoji: string },
  issues: Issue[],
): void => {
  const url = node.url.trim();
  if (url.length === 0) {
    issues.push({
      level: "error",
      nodeId: node.id,
      message: "Link button needs a URL.",
    });
  } else if (!/^https?:\/\//i.test(url)) {
    issues.push({
      level: "error",
      nodeId: node.id,
      message: "Link button URL must start with http:// or https://.",
    });
  } else if (url.length > LIMITS.buttonUrl) {
    issues.push({
      level: "error",
      nodeId: node.id,
      message: `Link button URL exceeds ${LIMITS.buttonUrl} characters.`,
    });
  }
  if (node.label.trim().length === 0 && node.emoji.trim().length === 0) {
    issues.push({
      level: "error",
      nodeId: node.id,
      message: "Link button needs a label, an emoji, or both.",
    });
  }
  if (node.label.length > LIMITS.buttonLabel) {
    issues.push({
      level: "error",
      nodeId: node.id,
      message: `Link button label exceeds ${LIMITS.buttonLabel} characters.`,
    });
  }
};

const validateTree = (root: ContainerNode, issues: Issue[]): void => {
  const total = countComponents(root);
  if (total > LIMITS.components) {
    issues.push({
      level: "error",
      message: `${total} components exceeds the limit of ${LIMITS.components}.`,
    });
  }
  if (root.components.length === 0) {
    issues.push({
      level: "error",
      nodeId: root.id,
      message: "The container is empty. Add at least one component.",
    });
  }

  walk(root, (node) => {
    if (!isComponentNode(node)) return;
    switch (node.type) {
      case ComponentType.TextDisplay:
        if (node.content.trim().length === 0) {
          issues.push({
            level: "warning",
            nodeId: node.id,
            message: "Text is empty.",
          });
        }
        break;
      case ComponentType.Section:
        if (node.components.length < LIMITS.sectionTextMin) {
          issues.push({
            level: "error",
            nodeId: node.id,
            message: "Section needs at least one text component.",
          });
        }
        if (node.components.length > LIMITS.sectionTextMax) {
          issues.push({
            level: "error",
            nodeId: node.id,
            message: `Section holds at most ${LIMITS.sectionTextMax} text components.`,
          });
        }
        break;
      case ComponentType.MediaGallery:
        if (node.items.length < LIMITS.galleryItemsMin) {
          issues.push({
            level: "error",
            nodeId: node.id,
            message: "Gallery needs at least one item.",
          });
        }
        if (node.items.length > LIMITS.galleryItemsMax) {
          issues.push({
            level: "error",
            nodeId: node.id,
            message: `Gallery holds at most ${LIMITS.galleryItemsMax} items.`,
          });
        }
        for (const item of node.items) {
          checkMedia(
            { url: item.url, nodeId: item.id, label: "Gallery item", video: true },
            issues,
          );
        }
        break;
      case ComponentType.ActionRow:
        if (node.components.length === 0) {
          issues.push({
            level: "error",
            nodeId: node.id,
            message: "Action row needs at least one button.",
          });
        }
        if (node.components.length > LIMITS.actionRowButtons) {
          issues.push({
            level: "error",
            nodeId: node.id,
            message: `Action row holds at most ${LIMITS.actionRowButtons} buttons.`,
          });
        }
        break;
      case ComponentType.Thumbnail:
        checkMedia(
          { url: node.url, nodeId: node.id, label: "Thumbnail", video: false },
          issues,
        );
        break;
      case ComponentType.Button:
        checkButton(node, issues);
        break;
    }
  });
};

/** Linked JSON delivery only: Discord caps the response at 3,000 raw bytes. */
export const linkedJsonBytes = (root: ContainerNode): number =>
  byteLength(JSON.stringify(toPayload(root)));

export const validate = (root: ContainerNode): Issue[] => {
  const issues: Issue[] = [];
  validateTree(root, issues);
  if (linkedJsonBytes(root) > LIMITS.linkedJsonBytes) {
    issues.push({
      level: "warning",
      message: `Payload is over ${LIMITS.linkedJsonBytes} bytes, so it can only be delivered inline, not as linked JSON.`,
    });
  }
  return issues;
};

export const countByLevel = (issues: Issue[], level: IssueLevel): number =>
  issues.filter((issue) => issue.level === level).length;

export const hasErrors = (issues: Issue[]): boolean =>
  issues.some((issue) => issue.level === "error");
