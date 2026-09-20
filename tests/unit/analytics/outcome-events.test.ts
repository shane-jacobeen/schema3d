import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import posthog from "posthog-js";
import {
  captureSchemaExported,
  captureSchemaShared,
  captureSchemaVisualizedIfPending,
  noteSchemaInputRoute,
  peekPendingSchemaInputRoute,
  resetPendingSchemaInputRoute,
  SCHEMA_EXPORTED_EVENT,
  SCHEMA_SHARED_EVENT,
  SCHEMA_VISUALIZED_EVENT,
} from "@/shared/analytics";
import { getInitialSchema } from "@/visualizer/state/initial-state";
import { encodeSchemaToUrl } from "@/shared/utils/url-encoding";

describe("outcome events", () => {
  beforeEach(() => {
    vi.spyOn(posthog, "capture").mockImplementation(() => undefined);
    resetPendingSchemaInputRoute();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits schema_visualized with a bounded input_route after a pending render", () => {
    noteSchemaInputRoute("paste");
    captureSchemaVisualizedIfPending(3);

    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith(SCHEMA_VISUALIZED_EVENT, {
      input_route: "paste",
    });
    expect(peekPendingSchemaInputRoute()).toBeNull();
  });

  it("does not emit when the schema has no tables", () => {
    noteSchemaInputRoute("upload");
    captureSchemaVisualizedIfPending(0);

    expect(posthog.capture).not.toHaveBeenCalled();
    expect(peekPendingSchemaInputRoute()).toBe("upload");
  });

  it("does not emit layout or filter updates without a pending route", () => {
    captureSchemaVisualizedIfPending(8);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("emits once per pending route", () => {
    noteSchemaInputRoute("sample");
    captureSchemaVisualizedIfPending(2);
    captureSchemaVisualizedIfPending(2);

    expect(posthog.capture).toHaveBeenCalledTimes(1);
  });

  it("does not include schema contents on share or export", () => {
    captureSchemaShared();
    captureSchemaExported("png");
    captureSchemaExported("csv");

    expect(posthog.capture).toHaveBeenNthCalledWith(1, SCHEMA_SHARED_EVENT);
    expect(posthog.capture).toHaveBeenNthCalledWith(2, SCHEMA_EXPORTED_EVENT, {
      export_type: "png",
    });
    expect(posthog.capture).toHaveBeenNthCalledWith(3, SCHEMA_EXPORTED_EVENT, {
      export_type: "csv",
    });
  });

  it("notes sample for the default initial schema", () => {
    window.location.hash = "";
    getInitialSchema();
    expect(peekPendingSchemaInputRoute()).toBe("sample");
  });

  it("notes url when the initial schema comes from a shareable hash", () => {
    const encoded = encodeSchemaToUrl(
      "CREATE TABLE products (id INT PRIMARY KEY);"
    );
    window.location.hash = `#sql:${encoded}`;
    getInitialSchema();
    expect(peekPendingSchemaInputRoute()).toBe("url");
    window.location.hash = "";
  });
});
