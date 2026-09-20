/**
 * Outcome events for Schema3D activation.
 *
 * Activation metric: `schema_visualized` — a schema is on screen in WebGL.
 * Compare that event by `input_route` and autocaptured `$browser`. Review a
 * week of data before adding more telemetry.
 *
 * Do not send SQL, schema contents, filenames, or other user content.
 *
 * Events and properties
 * ---------------------
 * schema_visualized
 *   When: WebGL canvas exists and the current schema has at least one table.
 *   Not when: WebGL fallback, empty parse, layout/filter/drag, or Apply of
 *   invalid input.
 *   input_route: "sample" | "paste" | "upload" | "url"
 *     sample  — default Retailer load or sample picker
 *     paste   — editor Apply (typed/pasted text, or a DrawDB share pasted
 *               into the dialog)
 *     upload  — file import then Apply
 *     url     — shareable hash (#sql: / #pako:) or ?drawdbShareId= landing.
 *               Distinct from sample so shared-link visits are not counted
 *               as the default schema.
 *
 * schema_shared
 *   When: shareable URL was copied to the clipboard.
 *   Properties: none.
 *
 * schema_exported
 *   When: PNG blob or CSV download started.
 *   export_type: "png" | "csv"
 */

import posthog from "posthog-js";

export const SCHEMA_INPUT_ROUTES = [
  "sample",
  "paste",
  "upload",
  "url",
] as const;
export type SchemaInputRoute = (typeof SCHEMA_INPUT_ROUTES)[number];

export const SCHEMA_EXPORT_TYPES = ["png", "csv"] as const;
export type SchemaExportType = (typeof SCHEMA_EXPORT_TYPES)[number];

export const SCHEMA_VISUALIZED_EVENT = "schema_visualized";
export const SCHEMA_SHARED_EVENT = "schema_shared";
export const SCHEMA_EXPORTED_EVENT = "schema_exported";

let pendingInputRoute: SchemaInputRoute | null = null;

export function noteSchemaInputRoute(route: SchemaInputRoute): void {
  pendingInputRoute = route;
}

export function resetPendingSchemaInputRoute(): void {
  pendingInputRoute = null;
}

export function peekPendingSchemaInputRoute(): SchemaInputRoute | null {
  return pendingInputRoute;
}

function consumePendingSchemaInputRoute(): SchemaInputRoute | null {
  const route = pendingInputRoute;
  pendingInputRoute = null;
  return route;
}

function capture(event: string, properties?: Record<string, string>): void {
  if (properties) {
    posthog.capture?.(event, properties);
    return;
  }
  posthog.capture?.(event);
}

/**
 * Fire `schema_visualized` once per pending input route after a usable
 * visualization exists. Layout/filter/drag updates do not set a pending
 * route, so they do not emit.
 */
export function captureSchemaVisualizedIfPending(tableCount: number): void {
  if (tableCount <= 0) {
    return;
  }
  const inputRoute = consumePendingSchemaInputRoute();
  if (!inputRoute) {
    return;
  }
  capture(SCHEMA_VISUALIZED_EVENT, { input_route: inputRoute });
}

export function captureSchemaShared(): void {
  capture(SCHEMA_SHARED_EVENT);
}

export function captureSchemaExported(exportType: SchemaExportType): void {
  capture(SCHEMA_EXPORTED_EVENT, { export_type: exportType });
}
