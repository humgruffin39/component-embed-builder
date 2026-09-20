import { describe, expect, it } from "vitest";
import {
  createButton,
  createActionRow,
  createContainer,
  createTextDisplay,
} from "@/lib/document";
import { topLevelIndexOf } from "@/lib/tree";

describe("drop index", () => {
  const first = createTextDisplay("first");
  const row = createActionRow();
  const button = createButton();
  row.components = [button];
  const last = createTextDisplay("last");
  const root = createContainer([first, row, last]);

  it("takes the slot of the row dropped on", () => {
    expect(topLevelIndexOf(root, first.id)).toBe(0);
    expect(topLevelIndexOf(root, last.id)).toBe(2);
  });

  it("counts a nested row as the top-level one it sits in", () => {
    expect(topLevelIndexOf(root, button.id)).toBe(1);
  });

  // The space below the last row belongs to no component, and dropping there
  // is how something gets added to the end.
  it("puts an id that matches no row at the end", () => {
    expect(topLevelIndexOf(root, "tree-end")).toBe(3);
    expect(topLevelIndexOf(root, root.id)).toBe(3);
  });
});
