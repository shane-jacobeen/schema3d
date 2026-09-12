import { describe, it, expect } from "vitest";
import {
  isAcceptedSchemaUploadFilename,
  SCHEMA_UPLOAD_ACCEPT,
} from "@/visualizer/ui/schema/schema-upload-utils";

describe("isAcceptedSchemaUploadFilename", () => {
  it("accepts SQL, Mermaid, and DrawDB extensions", () => {
    expect(isAcceptedSchemaUploadFilename("schema.sql")).toBe(true);
    expect(isAcceptedSchemaUploadFilename("diagram.mmd")).toBe(true);
    expect(isAcceptedSchemaUploadFilename("erd.mermaid")).toBe(true);
    expect(isAcceptedSchemaUploadFilename("blog-platform.drawdb.json")).toBe(
      true
    );
    expect(isAcceptedSchemaUploadFilename("export.DDB")).toBe(true);
  });

  it("rejects unsupported extensions", () => {
    expect(isAcceptedSchemaUploadFilename("notes.txt")).toBe(false);
    expect(isAcceptedSchemaUploadFilename("schema.exe")).toBe(false);
    expect(isAcceptedSchemaUploadFilename("schema")).toBe(false);
  });
});

describe("SCHEMA_UPLOAD_ACCEPT", () => {
  it("includes DrawDB json and ddb", () => {
    expect(SCHEMA_UPLOAD_ACCEPT).toContain(".json");
    expect(SCHEMA_UPLOAD_ACCEPT).toContain(".ddb");
    expect(SCHEMA_UPLOAD_ACCEPT).toContain(".sql");
  });
});
