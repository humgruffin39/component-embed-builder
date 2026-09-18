"use client";

import { Field, RadioGroup, Toggle } from "@/components/ui/Field";
import type { SeparatorNode } from "@/lib/document";
import { useBuilder } from "@/store/builder";

export const SeparatorInspector = ({ node }: { node: SeparatorNode }) => {
  const updateNode = useBuilder((state) => state.updateNode);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Spacing">
        {() => (
          <RadioGroup
            value={node.spacing === 2 ? "large" : "small"}
            onChange={(value) =>
              updateNode(node.id, { spacing: value === "large" ? 2 : 1 })
            }
            options={[
              { value: "small", label: "Small" },
              { value: "large", label: "Large" },
            ]}
          />
        )}
      </Field>

      <Toggle
        label="Draw a divider line"
        checked={node.divider}
        onChange={(divider) => updateNode(node.id, { divider })}
      />
    </div>
  );
};
