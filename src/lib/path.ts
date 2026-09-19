/**
 * Structural paths, the shared address space between the editor tree and the
 * rendered payload.
 *
 * The payload carries no ids: Discord rejects a key it does not expect, so the
 * editor strips them. But `toPayload` preserves order and shape exactly, so
 * `components.2.accessory` names the same node in both trees. That is what lets
 * the preview report what was clicked without ever knowing about editor nodes.
 */

/** The root container addresses itself with the empty path. */
export const ROOT_PATH = "";

export const childPath = (path: string, ...steps: (string | number)[]): string =>
  [path, ...steps].filter((step) => step !== "").join(".");
