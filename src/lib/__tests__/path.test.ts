import { describe, expect, it } from "vitest";
import {
  createActionRow,
  createButton,
  createContainer,
  createGalleryItem,
  createMediaGallery,
  createSection,
  createSeparator,
  createTextDisplay,
  createThumbnail,
  toPayload,
} from "@/lib/document";
import { ROOT_PATH } from "@/lib/path";
import {
  labelForNode,
  nodeAtPath,
  pathOfNode,
  visibleRows,
  walk,
} from "@/lib/tree";

const sample = () => {
  const section = createSection();
  section.components = [createTextDisplay("a"), createTextDisplay("b")];
  section.accessory = createThumbnail();

  const gallery = createMediaGallery();
  gallery.items = [createGalleryItem("x"), createGalleryItem("y")];

  const row = createActionRow();
  row.components = [createButton(), createButton()];

  return createContainer([
    createTextDisplay("top"),
    section,
    gallery,
    createSeparator(),
    row,
  ]);
};

/** The same walk the payload uses, so a path counted here is a path rendered there. */
const atPayloadPath = (payload: unknown, path: string): unknown =>
  path === ROOT_PATH
    ? payload
    : path
        .split(".")
        .reduce<unknown>(
          (value, step) => (value as Record<string, unknown>)[step],
          payload,
        );

describe("structural paths", () => {
  it("addresses the root with the empty path", () => {
    const root = sample();
    expect(nodeAtPath(root, ROOT_PATH)).toBe(root);
    expect(pathOfNode(root, root.id)).toBe(ROOT_PATH);
  });

  it("round trips every node in the tree", () => {
    const root = sample();
    walk(root, (node) => {
      const path = pathOfNode(root, node.id);
      expect(path).not.toBeNull();
      expect(nodeAtPath(root, path!)).toBe(node);
    });
  });

  it("names a section's accessory and its texts apart", () => {
    const root = sample();
    expect(pathOfNode(root, root.components[1].id)).toBe("components.1");
    const section = root.components[1];
    if (section.type !== 9) throw new Error("expected a section");
    expect(pathOfNode(root, section.accessory.id)).toBe("components.1.accessory");
    expect(pathOfNode(root, section.components[1].id)).toBe(
      "components.1.components.1",
    );
  });

  it("names gallery items, which carry no component type", () => {
    const root = sample();
    const gallery = root.components[2];
    if (gallery.type !== 12) throw new Error("expected a gallery");
    expect(pathOfNode(root, gallery.items[1].id)).toBe("components.2.items.1");
  });

  it("resolves to the matching node in the payload the preview renders", () => {
    const root = sample();
    const payload = toPayload(root);

    walk(root, (node) => {
      const path = pathOfNode(root, node.id)!;
      const target = atPayloadPath(payload.component, path);
      // Every editor node has a counterpart at the very same path.
      expect(target).toBeDefined();
      if ("type" in node) {
        expect((target as { type: number }).type).toBe(node.type);
      }
    });
  });

  it("returns null for a path that names nothing", () => {
    expect(nodeAtPath(sample(), "components.99")).toBeNull();
    expect(nodeAtPath(sample(), "nonsense")).toBeNull();
  });
});

describe("visible rows", () => {
  it("walks the tree top to bottom", () => {
    const root = sample();
    const rows = visibleRows(root, {}).map((row) => row.id);
    expect(rows[0]).toBe(root.id);
    expect(rows).toHaveLength(1 + 12); // root, plus every node under it
  });

  it("skips what is folded away", () => {
    const root = sample();
    const section = root.components[1];
    const open = visibleRows(root, {}).length;
    const folded = visibleRows(root, { [section.id]: true }).length;
    // Two texts and the accessory disappear with it.
    expect(open - folded).toBe(3);
  });

  it("reports the parent, so ArrowLeft can climb", () => {
    const root = sample();
    const rows = visibleRows(root, {});
    const gallery = root.components[2];
    if (gallery.type !== 12) throw new Error("expected a gallery");
    const item = rows.find((row) => row.id === gallery.items[0].id);
    expect(item?.parentId).toBe(gallery.id);
  });

  it("marks only the foldable rows as groups", () => {
    const root = sample();
    const groups = visibleRows(root, {})
      .filter((row) => row.group)
      .map((row) => row.id);
    expect(groups).toEqual([
      root.components[1].id,
      root.components[2].id,
      root.components[4].id,
    ]);
  });
});

describe("node labels", () => {
  it("names a component by its type", () => {
    const root = sample();
    expect(labelForNode(root, root.id)).toBe("Container");
    expect(labelForNode(root, root.components[0].id)).toBe("Text");
    expect(labelForNode(root, root.components[3].id)).toBe("Separator");
    expect(labelForNode(root, root.components[4].id)).toBe("Action Row");
  });

  it("numbers a gallery item by its place", () => {
    const root = sample();
    const gallery = root.components[2];
    if (gallery.type !== 12) throw new Error("expected a gallery");
    expect(labelForNode(root, gallery.items[0].id)).toBe("Item 1");
    expect(labelForNode(root, gallery.items[1].id)).toBe("Item 2");
  });

  it("falls back to the container when nothing is selected", () => {
    const root = sample();
    expect(labelForNode(root, null)).toBe("Container");
    expect(labelForNode(root, "gone")).toBe("Container");
  });

  it("names a section's accessory", () => {
    const root = sample();
    const section = root.components[1];
    if (section.type !== 9) throw new Error("expected a section");
    expect(labelForNode(root, section.accessory.id)).toBe("Thumbnail");
  });
});
