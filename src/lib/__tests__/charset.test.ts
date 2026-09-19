import { describe, expect, it } from "vitest";
import { charsetOf } from "@/lib/server/fetchPage";

describe("charset detection", () => {
  it("prefers the Content-Type header", () => {
    expect(charsetOf("text/html; charset=Shift_JIS", "")).toBe("shift_jis");
    expect(charsetOf('text/html; charset="EUC-JP"', "")).toBe("euc-jp");
  });

  it("falls back to the meta tag", () => {
    expect(charsetOf("text/html", '<meta charset="Shift_JIS">')).toBe(
      "shift_jis",
    );
    expect(
      charsetOf(
        "text/html",
        '<meta http-equiv="Content-Type" content="text/html; charset=euc-jp">',
      ),
    ).toBe("euc-jp");
  });

  it("lets the header win over the tag", () => {
    expect(charsetOf("text/html; charset=utf-8", '<meta charset="shift_jis">')).toBe(
      "utf-8",
    );
  });

  it("assumes utf-8 when nothing says otherwise", () => {
    expect(charsetOf("text/html", "<html><head></head>")).toBe("utf-8");
    expect(charsetOf("", "")).toBe("utf-8");
  });
});
