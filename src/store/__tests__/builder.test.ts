import { beforeEach, describe, expect, it } from "vitest";
import { ComponentType, LIMITS } from "@/lib/constants";
import { createContainer } from "@/lib/document";
import { destinationFor, findNode, isComponentNode } from "@/lib/tree";
import { useBuilder } from "@/store/builder";

const reset = () => useBuilder.getState().replaceDocument(createContainer([]));
const root = () => useBuilder.getState().root;
const labels = () =>
  root().components.map((child) => child.type);

beforeEach(reset);

describe("removing the last child", () => {
  it("takes the gallery with its final item", () => {
    useBuilder.getState().addComponent(ComponentType.MediaGallery);
    const gallery = root().components[0];
    if (gallery.type !== ComponentType.MediaGallery) throw new Error("no gallery");
    expect(gallery.items).toHaveLength(1);

    useBuilder.getState().removeNode(gallery.items[0].id);

    expect(findNode(root(), gallery.id)).toBeNull();
    expect(labels()).toEqual([]);
  });

  it("takes the action row with its final button", () => {
    useBuilder.getState().addComponent(ComponentType.ActionRow);
    const row = root().components[0];
    if (row.type !== ComponentType.ActionRow) throw new Error("no row");

    useBuilder.getState().removeNode(row.components[0].id);

    expect(findNode(root(), row.id)).toBeNull();
    expect(labels()).toEqual([]);
  });

  it("takes the section with its final text", () => {
    useBuilder.getState().addComponent(ComponentType.Section);
    const section = root().components[0];
    if (section.type !== ComponentType.Section) throw new Error("no section");

    useBuilder.getState().removeNode(section.components[0].id);

    expect(findNode(root(), section.id)).toBeNull();
    expect(labels()).toEqual([]);
  });

  it("keeps the parent while another child remains", () => {
    useBuilder.getState().addComponent(ComponentType.MediaGallery);
    const gallery = root().components[0];
    if (gallery.type !== ComponentType.MediaGallery) throw new Error("no gallery");

    useBuilder.getState().addGalleryItem(gallery.id);
    const [first] = (root().components[0] as typeof gallery).items;
    useBuilder.getState().removeNode(first.id);

    const after = root().components[0];
    expect(after?.id).toBe(gallery.id);
    if (after.type !== ComponentType.MediaGallery) throw new Error("no gallery");
    expect(after.items).toHaveLength(1);
  });

  it("cascades past more than one level", () => {
    useBuilder.getState().addComponent(ComponentType.Section);
    const section = root().components[0];
    if (section.type !== ComponentType.Section) throw new Error("no section");

    // The section is the container's only child; emptying it empties nothing
    // above, because a container is allowed to stand empty.
    useBuilder.getState().removeNode(section.components[0].id);
    expect(root().components).toHaveLength(0);
    expect(isComponentNode(root())).toBe(true);
  });

  it("leaves the selection on something that still exists", () => {
    useBuilder.getState().addComponent(ComponentType.ActionRow);
    const row = root().components[0];
    if (row.type !== ComponentType.ActionRow) throw new Error("no row");

    useBuilder.getState().select(row.components[0].id);
    useBuilder.getState().removeNode(row.components[0].id);

    const selected = useBuilder.getState().selectedId;
    expect(selected).not.toBeNull();
    expect(findNode(root(), selected!)).not.toBeNull();
  });
});

describe("history", () => {
  it("does not record a change that never happened", () => {
    useBuilder.getState().addComponent(ComponentType.Separator);
    const before = root();

    // Nothing answers to this id, so nothing should land in the history.
    useBuilder.getState().removeNode("missing");
    useBuilder.getState().updateNode("missing", { spacing: 2 });
    useBuilder.getState().moveNode("missing", "also-missing");
    useBuilder.getState().addGalleryItem("missing");
    useBuilder.getState().addButton("missing");
    useBuilder.getState().addToSection("missing", "text");

    useBuilder.getState().undo();
    // One undo steps back past the separator, not past a run of empty entries.
    expect(root().components).toHaveLength(0);
    expect(before.components).toHaveLength(1);
  });

  it("refuses a move the slot would not accept, and records nothing", () => {
    useBuilder.getState().addComponent(ComponentType.Separator);
    useBuilder.getState().addComponent(ComponentType.ActionRow);
    const row = root().components[1];
    if (row.type !== ComponentType.ActionRow) throw new Error("no row");

    // A separator is not a button, so the action row will not take it.
    useBuilder.getState().moveNode(root().components[0].id, row.components[0].id);
    expect(root().components).toHaveLength(2);

    useBuilder.getState().undo();
    expect(root().components).toHaveLength(1);
  });

  it("is dropped when the document is replaced", () => {
    useBuilder.getState().addComponent(ComponentType.Separator);
    expect(root().components).toHaveLength(1);

    useBuilder.getState().replaceDocument(createContainer([]));
    useBuilder.getState().undo();

    // Undo must not walk back into the document that was left behind.
    expect(root().components).toHaveLength(0);
  });
});

describe("moving between slots", () => {
  it("moves a text into a section", () => {
    useBuilder.getState().addComponent(ComponentType.Section);
    useBuilder.getState().addComponent(ComponentType.TextDisplay);
    const section = root().components[0];
    const text = root().components[1];
    if (section.type !== ComponentType.Section) throw new Error("no section");

    useBuilder.getState().moveNode(text.id, section.id);

    const after = root().components[0];
    if (after.type !== ComponentType.Section) throw new Error("no section");
    expect(root().components).toHaveLength(1);
    expect(after.components.map((c) => c.id)).toContain(text.id);
  });

  it("will not overfill a slot", () => {
    useBuilder.getState().addComponent(ComponentType.Section);
    const section = root().components[0];
    if (section.type !== ComponentType.Section) throw new Error("no section");
    // Fill the section to its limit.
    while (
      (root().components[0] as typeof section).components.length <
      LIMITS.sectionTextMax
    ) {
      useBuilder.getState().addToSection(section.id, "text");
    }
    useBuilder.getState().addComponent(ComponentType.TextDisplay);
    const spare = root().components[1];

    useBuilder.getState().moveNode(spare.id, section.id);

    expect(root().components).toHaveLength(2);
  });

  it("takes the emptied parent with it", () => {
    useBuilder.getState().addComponent(ComponentType.Section);
    useBuilder.getState().addComponent(ComponentType.Separator);
    const section = root().components[0];
    if (section.type !== ComponentType.Section) throw new Error("no section");
    const onlyText = section.components[0];

    // Dragging the section's only text out to the container empties the section.
    useBuilder.getState().moveNode(onlyText.id, root().components[1].id);

    expect(findNode(root(), section.id)).toBeNull();
    expect(findNode(root(), onlyText.id)).not.toBeNull();
  });
});

describe("selecting", () => {
  it("forgets the fold state of rows that have gone", () => {
    useBuilder.getState().addComponent(ComponentType.ActionRow);
    const row = root().components[0];
    useBuilder.getState().toggleCollapsed(row.id);
    useBuilder.getState().removeNode(row.id);

    expect(useBuilder.getState().collapsed).toEqual({});
  });

  it("unfolds the groups a node is buried in", () => {
    useBuilder.getState().addComponent(ComponentType.ActionRow);
    const row = root().components[0];
    if (row.type !== ComponentType.ActionRow) throw new Error("no row");

    useBuilder.getState().toggleCollapsed(row.id);
    expect(useBuilder.getState().collapsed[row.id]).toBe(true);

    // What a click in the preview does: select a node inside a folded group.
    useBuilder.getState().select(row.components[0].id);

    expect(useBuilder.getState().collapsed[row.id]).toBeUndefined();
  });
});

describe("where an addition lands", () => {
  it("is the container when nothing in particular is selected", () => {
    expect(destinationFor(root(), null).id).toBe(root().id);
    expect(destinationFor(root(), root().id).id).toBe(root().id);
  });

  it("is the gallery when one of its items is selected", () => {
    useBuilder.getState().addComponent(ComponentType.MediaGallery);
    const gallery = root().components[0];
    if (gallery.type !== ComponentType.MediaGallery) throw new Error("no gallery");

    expect(destinationFor(root(), gallery.items[0].id).id).toBe(gallery.id);
  });

  it("is the action row when one of its buttons is selected", () => {
    useBuilder.getState().addComponent(ComponentType.ActionRow);
    const row = root().components[0];
    if (row.type !== ComponentType.ActionRow) throw new Error("no row");

    expect(destinationFor(root(), row.components[0].id).id).toBe(row.id);
  });

  it("is the section for its text and for its accessory", () => {
    useBuilder.getState().addComponent(ComponentType.Section);
    const section = root().components[0];
    if (section.type !== ComponentType.Section) throw new Error("no section");

    expect(destinationFor(root(), section.components[0].id).id).toBe(section.id);
    expect(destinationFor(root(), section.accessory.id).id).toBe(section.id);
  });

  it("is the container for a top-level component", () => {
    useBuilder.getState().addComponent(ComponentType.Separator);
    const separator = root().components[0];
    expect(destinationFor(root(), separator.id).id).toBe(root().id);
  });
});
