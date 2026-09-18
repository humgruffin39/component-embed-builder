"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { ImportResponse } from "@/app/api/import/route";
import { CheckIcon } from "@/components/ui/icons";
import { Field, TextInput } from "@/components/ui/Field";
import { Popover } from "@/components/ui/Popover";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { fromPayload } from "@/lib/document";
import { normalizeUrl } from "@/lib/url";
import { useBuilder } from "@/store/builder";

type Status = "idle" | "loading" | "done";

/**
 * Cross-fades between label, spinner and tick. All three stay in the same grid
 * cell, so the button keeps the width of its widest state and never resizes
 * mid-import.
 */
const Layer = ({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) => (
  <span
    aria-hidden={!show}
    className={clsx(
      "col-start-1 row-start-1 flex items-center justify-center transition-all duration-200 ease-out",
      show
        ? "scale-100 opacity-100 blur-none"
        : "scale-75 opacity-0 blur-[2px]",
    )}
  >
    {children}
  </span>
);

export const ImportPopover = () => {
  const replaceDocument = useBuilder((state) => state.replaceDocument);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status !== "done") return;
    const timer = setTimeout(() => {
      setStatus("idle");
      setUrl("");
      setOpen(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [status]);

  const submit = async () => {
    if (status !== "idle" || url.trim().length === 0) return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalizeUrl(url) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "That import failed.");
        setStatus("idle");
        return;
      }
      const result = data as ImportResponse;
      replaceDocument(fromPayload(result.payload));
      setStatus("done");
    } catch {
      setError("That import failed.");
      setStatus("idle");
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      width={360}
      trigger={<Button size="sm">Import</Button>}
    >
      {/* The error rides in the label row: anything below the field would
          change the popover's height the moment an import fails. */}
      <Field
        label="Import URL"
        hint={
          error && (
            <span className="text-danger" title={error}>
              {error}
            </span>
          )
        }
      >
        {(id) => (
          <div className="flex items-center gap-2">
            <TextInput
              id={id}
              autoFocus
              value={url}
              spellCheck={false}
              placeholder="example.com/posts/version2"
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
            />
            <Button
              variant="primary"
              disabled={status !== "idle" || url.trim().length === 0}
              onClick={submit}
            >
              <span className="grid">
                <Layer show={status === "idle"}>Import</Layer>
                <Layer show={status === "loading"}>
                  <Spinner size={15} />
                </Layer>
                <Layer show={status === "done"}>
                  <CheckIcon size={15} ariaHidden />
                </Layer>
              </span>
            </Button>
          </div>
        )}
      </Field>
    </Popover>
  );
};
