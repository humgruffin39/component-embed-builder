import { describe, expect, it } from "vitest";
import { ComponentType, LINK_BUTTON_STYLE } from "@/lib/constants";
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
  fromPayload,
  toPayload,
} from "@/lib/document";
import { parsePayload } from "@/lib/schema";
import { countComponents } from "@/lib/tree";

const sample = () => {
  const section = createSection();
  section.components = [createTextDisplay("# Title")];
  section.accessory = {
    ...createThumbnail(),
    url: "https://example.com/thumb.png",
    description: "Alt",
    spoiler: true,
  };

  const gallery = createMediaGallery();
  gallery.items = [
    createGalleryItem("https://example.com/a.png"),
    { ...createGalleryItem("https://example.com/b.png"), description: "Second" },
  ];

  const row = createActionRow();
  row.components = [
    { ...createButton(), label: "Store", url: "https://example.com/store" },
  ];

  return createContainer([section, gallery, createSeparator(), row]);
};

describe("payload conversion", () => {
  it("emits only keys Discord accepts", () => {
    const payload = toPayload(sample());
    const [section] = payload.component.components;

    expect(payload.component.type).toBe(ComponentType.Container);
    expect(Object.keys(payload.component).sort()).toEqual([
      "accent_color",
      "components",
      "type",
    ]);
    expect(section.type).toBe(ComponentType.Section);
    expect(JSON.stringify(payload)).not.toContain('"id"');
  });

  it("uses the link button style and drops empty optionals", () => {
    const row = createActionRow();
    row.components = [
      { ...createButton(), label: "Go", emoji: "", url: "https://example.com" },
    ];
    const payload = toPayload(createContainer([row]));
    const button = payload.component.components[0];

    expect(button).toEqual({
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: LINK_BUTTON_STYLE,
          url: "https://example.com",
          label: "Go",
        },
      ],
    });
  });

  it("omits accent_color when the container has none", () => {
    const root = createContainer([createTextDisplay("Hi")]);
    root.accentColor = null;
    expect(toPayload(root).component).not.toHaveProperty("accent_color");
  });

  it("round trips through the wire format", () => {
    const payload = toPayload(sample());
    expect(toPayload(fromPayload(payload))).toEqual(payload);
  });

  it("produces payloads its own schema accepts", () => {
    expect(parsePayload(toPayload(sample())).ok).toBe(true);
  });
});

describe("component counting", () => {
  it("counts nested components but not gallery items", () => {
    const gallery = createMediaGallery();
    gallery.items = [
      createGalleryItem("https://example.com/a.png"),
      createGalleryItem("https://example.com/b.png"),
    ];
    // Container + gallery.
    expect(countComponents(createContainer([gallery]))).toBe(2);

    const section = createSection();
    section.components = [createTextDisplay("a"), createTextDisplay("b")];
    // Container + section + two texts + accessory.
    expect(countComponents(createContainer([section]))).toBe(5);
  });
});
