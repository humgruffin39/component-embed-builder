import { useState } from "react";
import clsx from "clsx";
import { useSelectable, useSelection } from "./selection";

interface MediaProps {
  path: string;
  /** What to call this in the selection badge. */
  label: string;
  url: string;
  description?: string;
  spoiler?: boolean;
  className?: string;
}

const VIDEO_PATTERN = /\.(mp4|mov|webm)(\?|#|$)/i;

/** One image or video, with the click-to-reveal behaviour Discord gives spoilers. */
export const Media = ({
  path,
  label,
  url,
  description,
  spoiler,
  className,
}: MediaProps) => {
  const [revealed, setRevealed] = useState(false);
  const selectable = useSelectable(path, label);
  const { onSelect, platform } = useSelection();

  // Toggling the flag off and on has to bring the cover back, so the reveal
  // resets whenever the flag itself changes.
  const [lastSpoiler, setLastSpoiler] = useState(spoiler);
  if (spoiler !== lastSpoiler) {
    setLastSpoiler(spoiler);
    setRevealed(false);
  }

  const hidden = Boolean(spoiler) && !revealed;
  const alt = description ?? "";

  return (
    <div
      {...selectable}
      className={clsx(
        "dc-media",
        hidden && "dc-media--spoiler",
        className,
        selectable.className,
      )}
      onClick={(event) => {
        if (hidden) setRevealed(true);
        // A video owns its controls. Select it, but do not swallow the click,
        // or play and scrub stop working.
        if ((event.target as HTMLElement).tagName === "VIDEO") {
          event.stopPropagation();
          onSelect?.(path);
          return;
        }
        selectable.onClick?.(event);
      }}
    >
      {url.length === 0 ? (
        <div className="dc-media__empty">No URL</div>
      ) : VIDEO_PATTERN.test(url) ? (
        <video className="dc-media__asset" src={url} controls preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="dc-media__asset" src={url} alt={alt} loading="lazy" />
      )}
      {hidden && <span className="dc-media__badge">Spoiler</span>}
      {/* Only the mobile client shows this, so the preview does the same. */}
      {platform === "mobile" && !hidden && alt.length > 0 && (
        <span className="dc-media__alt" title={alt}>
          ALT
        </span>
      )}
    </div>
  );
};
