import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComponentEmbed } from "@/components/preview";
import {
  createActionRow,
  createButton,
  createContainer,
  createGalleryItem,
  createMediaGallery,
  createSection,
  createTextDisplay,
  createThumbnail,
  toPayload,
} from "@/lib/document";

const sample = () => {
  const section = createSection();
  section.components = [createTextDisplay("# Heading")];
  section.accessory = { ...createThumbnail(), url: "https://example.com/a.png" };

  const gallery = createMediaGallery();
  gallery.items = [createGalleryItem("https://example.com/b.png")];

  const row = createActionRow();
  row.components = [
    { ...createButton(), label: "Open", url: "https://example.com" },
  ];

  return createContainer([createTextDisplay("Top"), section, gallery, row]);
};

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    <ComponentEmbed payload={toPayload(sample())} {...props} />,
  );

describe("the renderer on its own", () => {
  it("adds no selection markup when nothing asked for it", () => {
    const html = render();
    expect(html).not.toContain("data-path");
    expect(html).not.toContain("dc-selectable");
  });

  it("keeps a link button as a real link", () => {
    expect(render()).toContain('href="https://example.com"');
  });

  it("renders markdown as elements, never as raw html", () => {
    const html = renderToStaticMarkup(
      <ComponentEmbed
        payload={toPayload(
          createContainer([createTextDisplay("# Hi <script>x</script>")]),
        )}
      />,
    );
    expect(html).toContain("<h1");
    expect(html).not.toContain("<script>");
  });
});

describe("the renderer with selection on", () => {
  const html = render({ onSelectPath: () => {} });

  it("labels every component with its path", () => {
    for (const path of [
      'data-path=""',
      'data-path="components.0"',
      'data-path="components.1.components.0"',
      'data-path="components.1.accessory"',
      'data-path="components.2.items.0"',
      'data-path="components.3.components.0"',
    ]) {
      expect(html).toContain(path);
    }
  });

  it("names them for the badge", () => {
    expect(html).toContain('data-label="Container"');
    expect(html).toContain('data-label="Text"');
    expect(html).toContain('data-label="Thumbnail"');
    expect(html).toContain('data-label="Item 1"');
    expect(html).toContain('data-label="Link Button"');
  });

  it("stops the button being a way out of the page", () => {
    expect(html).not.toContain('href="https://example.com"');
    expect(html).not.toContain('target="_blank"');
  });

  it("marks the selected path and nothing else", () => {
    const selected = render({
      onSelectPath: () => {},
      selectedPath: "components.0",
    });
    expect(selected.match(/data-selected/g)).toHaveLength(1);
  });
});

describe("client differences", () => {
  const withAlt = () => {
    const gallery = createMediaGallery();
    const item = createGalleryItem("https://example.com/a.png");
    item.description = "A red square";
    gallery.items = [item];
    return createContainer([gallery]);
  };

  it("keeps the alt badge off the desktop client", () => {
    const html = renderToStaticMarkup(
      <ComponentEmbed payload={toPayload(withAlt())} platform="desktop" />,
    );
    expect(html).not.toContain("dc-media__alt");
  });

  it("shows it on the mobile one, which is where Discord puts it", () => {
    const html = renderToStaticMarkup(
      <ComponentEmbed payload={toPayload(withAlt())} platform="mobile" />,
    );
    expect(html).toContain("dc-media__alt");
    expect(html).toContain("ALT");
    expect(html).toContain('title="A red square"');
  });

  it("leaves it off an image with no description", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("https://example.com/a.png")];
    const html = renderToStaticMarkup(
      <ComponentEmbed
        payload={toPayload(createContainer([gallery]))}
        platform="mobile"
      />,
    );
    expect(html).not.toContain("dc-media__alt");
  });
});
