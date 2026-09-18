"use client";

import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { CONTROL_HEIGHT } from "@/components/ui/control";

/** Shared skin. Height comes from the token for inputs; a textarea is sized by its rows. */
const CONTROL =
  "w-full rounded-md border border-line bg-bg px-2.5 text-[13px] text-fg transition-colors placeholder:text-faint focus:border-line-strong";

interface FieldProps {
  label: string;
  /** Sits immediately right of the label, for a badge the label itself earns. */
  mark?: ReactNode;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
}

export const Field = ({ label, mark, hint, children }: FieldProps) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 leading-none">
          <label
            htmlFor={id}
            className="text-[12px] leading-none font-medium text-muted"
          >
            {label}
          </label>
          {mark}
        </span>
        {hint && (
          <span className="min-w-0 truncate text-[11px] text-faint tabular-nums">
            {hint}
          </span>
        )}
      </div>
      {children(id)}
    </div>
  );
};

export const TextInput = ({
  className,
  ...props
}: ComponentPropsWithRef<"input">) => (
  <input className={clsx(CONTROL, CONTROL_HEIGHT, className)} {...props} />
);

export const TextArea = ({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) => (
  <textarea
    className={clsx(CONTROL, "resize-y py-1.5 font-mono leading-relaxed", className)}
    {...props}
  />
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle = ({ label, checked, onChange }: ToggleProps) => (
  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-fg select-none">
    <span
      className={clsx(
        "relative h-4 w-7 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-line-strong",
      )}
    >
      <input
        type="checkbox"
        className="absolute inset-0 cursor-pointer opacity-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={clsx(
          "pointer-events-none absolute top-0.5 size-3 rounded-full bg-white transition-[left]",
          checked ? "left-3.5" : "left-0.5",
        )}
      />
    </span>
    {label}
  </label>
);

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentedProps<T>) => (
  <div
    className={clsx(
      "inline-flex rounded-md border border-line bg-bg p-0.5",
      className,
    )}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={clsx(
          "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
          option.value === value
            ? "bg-selected text-fg"
            : "text-muted hover:bg-selected/40 hover:text-fg",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

interface RadioProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export const RadioGroup = <T extends string>({
  value,
  options,
  onChange,
}: RadioProps<T>) => (
  <RadioGroupPrimitive.Root
    value={value}
    onValueChange={(next) => onChange(next as T)}
    className="flex flex-col gap-1.5"
  >
    {options.map((option) => (
      <label
        key={option.value}
        className="flex cursor-pointer items-center gap-2 text-[13px] text-fg select-none"
      >
        <RadioGroupPrimitive.Item
          value={option.value}
          className="flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong bg-bg transition-colors data-[state=checked]:border-accent"
        >
          <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-accent" />
        </RadioGroupPrimitive.Item>
        {option.label}
      </label>
    ))}
  </RadioGroupPrimitive.Root>
);
