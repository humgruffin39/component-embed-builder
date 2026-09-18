import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/constants";
import {
  type ContainerNode,
  createActionRow,
  createButton,
  createContainer,
  createGalleryItem,
  createMediaGallery,
  createSection,
  createTextDisplay,
  createThumbnail,
} from "@/lib/document";
import { type Issue, validate } from "@/lib/validate";

const documentWith = (
  components: ContainerNode["components"],
): ContainerNode => createContainer(components);

const errors = (issues: Issue[]) =>
  issues.filter((issue) => issue.level === "error").map((issue) => issue.message);

const warnings = (issues: Issue[]) =>
  issues
    .filter((issue) => issue.level === "warning")
    .map((issue) => issue.message);

const validText = () => createTextDisplay("Hello");

const validGallery = () => {
  const gallery = createMediaGallery();
  gallery.items = [createGalleryItem("https://example.com/a.png")];
  return gallery;
};

describe("component limits", () => {
  it("accepts a well formed document", () => {
    const issues = validate(documentWith([validText(), validGallery()]));
    expect(errors(issues)).toEqual([]);
  });

  it("rejects an empty container", () => {
    expect(errors(validate(documentWith([])))).toContain(
      "The container is empty. Add at least one component.",
    );
  });

  it(`rejects more than ${LIMITS.components} components`, () => {
    const components = Array.from({ length: LIMITS.components }, validText);
    const issues = validate(documentWith(components));
    // The container itself counts, so this is one over.
    expect(errors(issues)).toContain(
      `${LIMITS.components + 1} components exceeds the limit of ${LIMITS.components}.`,
    );
  });

  it(`rejects a gallery with more than ${LIMITS.galleryItemsMax} items`, () => {
    const gallery = createMediaGallery();
    gallery.items = Array.from({ length: LIMITS.galleryItemsMax + 1 }, () =>
      createGalleryItem("https://example.com/a.png"),
    );
    expect(errors(validate(documentWith([gallery])))).toContain(
      `Gallery holds at most ${LIMITS.galleryItemsMax} items.`,
    );
  });

  it("rejects an empty gallery", () => {
    const gallery = createMediaGallery();
    gallery.items = [];
    expect(errors(validate(documentWith([gallery])))).toContain(
      "Gallery needs at least one item.",
    );
  });

  it(`rejects a section with more than ${LIMITS.sectionTextMax} texts`, () => {
    const section = createSection();
    section.components = Array.from(
      { length: LIMITS.sectionTextMax + 1 },
      validText,
    );
    section.accessory = createThumbnail();
    section.accessory.url = "https://example.com/a.png";
    expect(errors(validate(documentWith([section])))).toContain(
      `Section holds at most ${LIMITS.sectionTextMax} text components.`,
    );
  });

  it("rejects a section with no text", () => {
    const section = createSection();
    section.components = [];
    section.accessory = createThumbnail();
    section.accessory.url = "https://example.com/a.png";
    expect(errors(validate(documentWith([section])))).toContain(
      "Section needs at least one text component.",
    );
  });

  it(`rejects more than ${LIMITS.actionRowButtons} buttons in a row`, () => {
    const row = createActionRow();
    row.components = Array.from({ length: LIMITS.actionRowButtons + 1 }, () => ({
      ...createButton(),
      url: "https://example.com",
    }));
    expect(errors(validate(documentWith([row])))).toContain(
      `Action row holds at most ${LIMITS.actionRowButtons} buttons.`,
    );
  });
});

describe("link buttons", () => {
  it("requires a URL", () => {
    const row = createActionRow();
    expect(errors(validate(documentWith([row])))).toContain(
      "Link button needs a URL.",
    );
  });

  it("requires an absolute http URL", () => {
    const row = createActionRow();
    row.components = [{ ...createButton(), url: "/relative" }];
    expect(errors(validate(documentWith([row])))).toContain(
      "Link button URL must start with http:// or https://.",
    );
  });

  it("requires a label or an emoji", () => {
    const row = createActionRow();
    row.components = [
      { ...createButton(), label: "", emoji: "", url: "https://example.com" },
    ];
    expect(errors(validate(documentWith([row])))).toContain(
      "Link button needs a label, an emoji, or both.",
    );
  });

  it(`rejects a label over ${LIMITS.buttonLabel} characters`, () => {
    const row = createActionRow();
    row.components = [
      {
        ...createButton(),
        label: "x".repeat(LIMITS.buttonLabel + 1),
        url: "https://example.com",
      },
    ];
    expect(errors(validate(documentWith([row])))).toContain(
      `Link button label exceeds ${LIMITS.buttonLabel} characters.`,
    );
  });
});

describe("media", () => {
  it("requires a URL", () => {
    const gallery = createMediaGallery();
    expect(errors(validate(documentWith([gallery])))).toContain(
      "Gallery item needs a URL.",
    );
  });

  it("rejects attachment references", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("attachment://hero.png")];
    expect(errors(validate(documentWith([gallery])))).toContain(
      "Gallery item URL must start with http:// or https://.",
    );
  });

  it("warns about http", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("http://example.com/a.png")];
    expect(warnings(validate(documentWith([gallery])))).toContain(
      "Gallery item URL uses http. Serve it over https.",
    );
  });

  it("warns about unsupported formats", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("https://example.com/a.bmp")];
    expect(warnings(validate(documentWith([gallery])))).toContainEqual(
      expect.stringContaining("format .bmp"),
    );
  });

  it("rejects video in a thumbnail but allows it in a gallery", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("https://example.com/a.mp4")];
    expect(warnings(validate(documentWith([gallery])))).toEqual([]);

    const section = createSection();
    section.accessory = { ...createThumbnail(), url: "https://example.com/a.mp4" };
    expect(warnings(validate(documentWith([section])))).toContainEqual(
      expect.stringContaining("format .mp4"),
    );
  });
});

describe("payload size", () => {
  it(`warns past the ${LIMITS.linkedJsonBytes} byte linked JSON cap`, () => {
    const issues = validate(
      documentWith([createTextDisplay("x".repeat(LIMITS.linkedJsonBytes))]),
    );
    expect(warnings(issues)).toContainEqual(
      expect.stringContaining("can only be delivered inline"),
    );
  });
});
