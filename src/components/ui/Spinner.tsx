import clsx from "clsx";
import { useId } from "react";

/**
 * A gradient ring that reads as motion even at 14px, where a plain dashed
 * circle turns into a flicker.
 */
export const Spinner = ({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  const id = useId();

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      className={clsx("animate-spin", className)}
    >
      <defs>
        <linearGradient id={`${id}-lead`} x1="50%" x2="50%" y1="5%" y2="92%">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id={`${id}-tail`} x1="50%" x2="50%" y1="15%" y2="87%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <g fill="none" transform="translate(1.5 1.625)">
        <path
          fill={`url(#${id}-lead)`}
          d="M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.5 7.5 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021"
        />
        <path
          fill={`url(#${id}-tail)`}
          d="M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.48 10.48 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084a1.5 1.5 0 0 1-.115-2.118"
        />
      </g>
    </svg>
  );
};
