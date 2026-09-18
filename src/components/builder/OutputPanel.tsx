"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { CopyButton } from "@/components/ui/CopyButton";
import { ErrorIcon, WarningIcon } from "@/components/ui/icons";
import { STACK_ICONS } from "@/components/ui/stackIcons";
import type { ContainerNode } from "@/lib/document";
import { type OutputFormatId, OUTPUT_FORMATS } from "@/lib/generators";
import { type Issue, hasErrors } from "@/lib/validate";
import { useBuilder } from "@/store/builder";

const IssueRow = ({ issue }: { issue: Issue }) => {
  const select = useBuilder((state) => state.select);
  const error = issue.level === "error";
  const Icon = error ? ErrorIcon : WarningIcon;

  return (
    <li>
      <button
        type="button"
        disabled={!issue.nodeId}
        onClick={() => issue.nodeId && select(issue.nodeId)}
        className={clsx(
          "flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-[12px] leading-relaxed",
          issue.nodeId && "hover:bg-selected",
        )}
      >
        <Icon
          size={14}
          ariaHidden
          className={clsx("mt-0.5 shrink-0", error ? "text-danger" : "text-warn")}
        />
        <span className="text-muted">{issue.message}</span>
      </button>
    </li>
  );
};

interface OutputPanelProps {
  root: ContainerNode;
  issues: Issue[];
}

export const OutputPanel = ({ root, issues }: OutputPanelProps) => {
  const [formatId, setFormatId] = useState<OutputFormatId>("html");

  const format = OUTPUT_FORMATS.find((entry) => entry.id === formatId)!;
  const blocked = hasErrors(issues);
  const code = useMemo(
    () => (blocked ? "" : format.generate(root)),
    [blocked, format, root],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        {OUTPUT_FORMATS.map((entry) => {
          const Icon = STACK_ICONS[entry.id];
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setFormatId(entry.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-medium transition-colors",
                entry.id === formatId
                  ? "bg-selected text-fg"
                  : "text-muted hover:bg-selected/40 hover:text-fg",
              )}
            >
              <Icon className="size-3.5" />
              {entry.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-b border-line py-1 pr-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-faint">
          {format.filename}
        </span>
        <CopyButton value={code} />
      </div>

      <div className="scroll-area flex-1 overflow-auto bg-panel">
        {blocked ? (
          <ul className="p-1.5">
            {issues
              .filter((issue) => issue.level === "error")
              .map((issue, index) => (
                <IssueRow key={index} issue={issue} />
              ))}
          </ul>
        ) : (
          <CodeBlock code={code} language={format.language} />
        )}
      </div>

      {!blocked && issues.length > 0 && (
        <ul className="scroll-area max-h-24 overflow-y-auto border-t border-line p-1.5">
          {issues.map((issue, index) => (
            <IssueRow key={index} issue={issue} />
          ))}
        </ul>
      )}
    </div>
  );
};
