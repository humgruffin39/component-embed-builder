"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import clsx from "clsx";
import { PipetteIcon } from "@/components/ui/icons";
import {
  type Hsv,
  hsvToRgb,
  numberToRgb,
  parseHex,
  rgbToHsv,
  rgbToNumber,
  toHex,
} from "@/lib/color";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Pointer handling for both the square and the hue strip. Capturing the
 * pointer keeps the drag alive outside the element without a window listener
 * to leak.
 */
const useDragArea = (onMove: (x: number, y: number) => void) => {
  const ref = useRef<HTMLDivElement>(null);

  const track = useCallback(
    (event: ReactPointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      onMove(
        clamp01((event.clientX - box.left) / box.width),
        clamp01((event.clientY - box.top) / box.height),
      );
    },
    [onMove],
  );

  return {
    ref,
    onPointerDown: (event: ReactPointerEvent) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      track(event);
    },
    onPointerMove: (event: ReactPointerEvent) => {
      if (event.buttons & 1) track(event);
    },
  };
};

const subscribe = () => () => {};

const EyeDropper = ({ onPick }: { onPick: (value: number) => void }) => {
  // Chromium only. Read on the client, false on the server, so the markup
  // matches on hydration.
  const supported = useSyncExternalStore(
    subscribe,
    () => "EyeDropper" in window,
    () => false,
  );

  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label="Pick a colour from the screen"
      onClick={async () => {
        try {
          const picker = new (
            window as unknown as {
              EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
            }
          ).EyeDropper();
          const { sRGBHex } = await picker.open();
          const value = parseHex(sRGBHex);
          if (value !== null) onPick(value);
        } catch {
          // The picker was dismissed; nothing to report.
        }
      }}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-bg text-muted shadow-raised transition-colors hover:border-line-strong hover:text-fg"
    >
      <PipetteIcon size={14} ariaHidden />
    </button>
  );
};

interface ColorPickerProps {
  /** 24-bit RGB. Alpha is absent on purpose: an accent colour has none. */
  value: number;
  onChange: (value: number) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(numberToRgb(value)));
  const [draft, setDraft] = useState<string | null>(null);
  const emitted = useRef(value);

  // Adopt a colour set from outside, but hold on to the hue: grey and black
  // carry none, and losing it would snap the square back to red.
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    const next = rgbToHsv(numberToRgb(value));
    setHsv((previous) => ({ ...next, h: next.s === 0 ? previous.h : next.h }));
  }, [value]);

  const commit = useCallback(
    (next: Hsv) => {
      setHsv(next);
      const number = rgbToNumber(hsvToRgb(next));
      emitted.current = number;
      onChange(number);
    },
    [onChange],
  );

  const square = useDragArea(
    useCallback(
      (x, y) => commit({ ...hsv, s: x, v: 1 - y }),
      [commit, hsv],
    ),
  );
  const strip = useDragArea(
    useCallback((x) => commit({ ...hsv, h: x * 360 }), [commit, hsv]),
  );

  const rgb = hsvToRgb(hsv);
  const number = rgbToNumber(rgb);
  const hex = toHex(number);
  const nudgeHue = (by: number) => commit({ ...hsv, h: (hsv.h + by + 360) % 360 });

  return (
    <div className="flex flex-col gap-3">
      <div
        {...square}
        className="relative h-36 w-full cursor-crosshair rounded-md"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
        }}
      >
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <EyeDropper onPick={(picked) => commit(rgbToHsv(numberToRgb(picked)))} />
        <div
          {...strip}
          role="slider"
          tabIndex={0}
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") nudgeHue(-2);
            else if (event.key === "ArrowRight") nudgeHue(2);
            else return;
            event.preventDefault();
          }}
          className="relative h-3 flex-1 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{
            background:
              "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        >
          <span
            className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            style={{ left: `${(hsv.h / 360) * 100}%`, background: hex }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[12px] font-medium text-faint">HEX</span>
        <input
          value={draft ?? hex}
          spellCheck={false}
          aria-label="Hex value"
          className={clsx(
            "h-8 min-w-0 flex-1 rounded-md border bg-bg px-2.5 text-[13px] text-fg shadow-raised outline-none transition-colors focus:border-line-strong",
            draft !== null && parseHex(draft) === null
              ? "border-danger"
              : "border-line",
          )}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const parsed = parseHex(text);
            if (parsed !== null) commit(rgbToHsv(numberToRgb(parsed)));
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </div>
  );
};
