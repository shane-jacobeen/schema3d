import { describe, it, expect } from "vitest";
import { getSchemaText } from "@/schemas/utils/load-schemas";
import { schemaToFormat } from "@/schemas/utils/schema-converter";
import { parseSchema } from "@/schemas/parsers";

/**
 * Share must encode the live schema via schemaToFormat — not getSchemaText(name),
 * which always returns the stock sample fixture.
 */
describe("share schema text", () => {
  it("uses live schema text for edited Blog Platform, not the sample fixture", () => {
    const fixture = getSchemaText("Blog Platform");
    expect(fixture).toBeTruthy();

    const schema = parseSchema(fixture!, "drawdb");
    expect(schema).toBeTruthy();
    expect(schema!.tables.length).toBeGreaterThan(1);

    const edited = {
      ...schema!,
      name: "Blog Platform",
      format: "drawdb" as const,
      tables: schema!.tables.slice(0, 1),
    };

    const shareText = schemaToFormat(edited);
    expect(shareText).not.toBe(fixture);
    expect(shareText).toContain(edited.tables[0].name);
  });
});
