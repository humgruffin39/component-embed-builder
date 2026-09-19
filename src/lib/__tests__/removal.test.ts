import { describe, expect, it } from "vitest";
import {
  createActionRow,
  createButton,
  createContainer,
  createGalleryItem,
  createMediaGallery,
  createSection,
  createTextDisplay,
} from "@/lib/document";
import { ancestorsOf, findNode, hasEmptyRequiredSlot } from "@/lib/tree";

describe("required slots", () => {
  it("reports a section, gallery or row that has been emptied", () => {
    const section = createSection();
    section.components = [];
    expect(hasEmptyRequiredSlot(section)).toBe(true);

    const gallery = createMediaGallery();
    gallery.items = [];
    expect(hasEmptyRequiredSlot(gallery)).toBe(true);

    const row = createActionRow();
    row.components = [];
    expect(hasEmptyRequiredSlot(row)).toBe(true);
  });

  it("leaves a filled slot, a separator and the container alone", () => {
    expect(hasEmptyRequiredSlot(createSection())).toBe(false);
    expect(hasEmptyRequiredSlot(createMediaGallery())).toBe(false);
    expect(hasEmptyRequiredSlot(createActionRow())).toBe(false);
    expect(hasEmptyRequiredSlot(createContainer([]))).toBe(false);
    expect(hasEmptyRequiredSlot(createTextDisplay())).toBe(false);
  });

  it("does not report a gallery that still holds one item", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("a")];
    expect(hasEmptyRequiredSlot(gallery)).toBe(false);
  });
});

describe("ancestors", () => {
  it("lists the chain innermost first", () => {
    const row = createActionRow();
    const button = createButton();
    row.components = [button];
    const root = createContainer([row]);

    expect(ancestorsOf(root, button.id).map((node) => node.id)).toEqual([
      row.id,
      root.id,
    ]);
  });

  it("is empty for the root", () => {
    const root = createContainer([]);
    expect(ancestorsOf(root, root.id)).toEqual([]);
  });

  it("reaches a gallery item, which carries no component type", () => {
    const gallery = createMediaGallery();
    const item = createGalleryItem("a");
    gallery.items = [item];
    const root = createContainer([gallery]);

    expect(ancestorsOf(root, item.id).map((node) => node.id)).toEqual([
      gallery.id,
      root.id,
    ]);
    expect(findNode(root, item.id)).toBe(item);
  });
});
