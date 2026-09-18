/**
 * Every icon in the app comes from one set, aliased here so call sites read
 * by intent rather than by the set's naming. The stack logos in
 * `stackIcons.tsx` are the exception: those are the vendors' own marks.
 *
 * Each icon wraps its paths in a `<mask>` whose `id` is fixed per icon name,
 * not per render. Two instances of the same icon on one page collide on that
 * id, and the loser renders as a solid square instead of its shape.
 * `mode="raw"` skips the mask, so every icon here is forced into that mode.
 */
import type { ComponentType } from "react";
import {
  IconArrowUpRight,
  type CentralIconBaseProps as IconProps,
  IconCard,
  IconCheckmark1,
  IconChevronRight,
  IconColumns3,
  IconDivider,
  IconDotGrid2x3,
  IconEmojiAddReaction,
  IconExclamationCircle,
  IconImages1Alt,
  IconImages4,
  IconLayoutColumn,
  IconPlusMedium,
  IconSquareBehindSquare2,
  IconTextBlock,
  IconTrashCanSimple,
  IconWarningSign,
} from "@central-icons-react/round-filled-radius-3-stroke-2";
import { ComponentType as EmbedComponentType } from "@/lib/constants";

export type { IconProps };
export type Icon = ComponentType<IconProps>;

const raw = (Source: Icon): Icon => {
  const Wrapped = (props: IconProps) => <Source mode="raw" {...props} />;
  Wrapped.displayName = `Raw(${Source.displayName ?? "Icon"})`;
  return Wrapped;
};

export const CheckIcon = raw(IconCheckmark1);
export const ChevronIcon = raw(IconChevronRight);
export const CopyIcon = raw(IconSquareBehindSquare2);
export const EmojiIcon = raw(IconEmojiAddReaction);
export const ErrorIcon = raw(IconExclamationCircle);
export const ExternalIcon = raw(IconArrowUpRight);
export const GripIcon = raw(IconDotGrid2x3);
export const PlusIcon = raw(IconPlusMedium);
export const TrashIcon = raw(IconTrashCanSimple);
export const WarningIcon = raw(IconWarningSign);

/** One icon per component type, so every row in the tree carries its own. */
export const NODE_ICONS: Record<number, Icon> = {
  [EmbedComponentType.Container]: raw(IconCard),
  [EmbedComponentType.TextDisplay]: raw(IconTextBlock),
  [EmbedComponentType.Section]: raw(IconLayoutColumn),
  [EmbedComponentType.MediaGallery]: raw(IconImages4),
  [EmbedComponentType.Separator]: raw(IconDivider),
  [EmbedComponentType.ActionRow]: raw(IconColumns3),
  [EmbedComponentType.Thumbnail]: raw(IconImages1Alt),
  [EmbedComponentType.Button]: raw(IconArrowUpRight),
};

export const GalleryItemIcon = raw(IconImages1Alt);
