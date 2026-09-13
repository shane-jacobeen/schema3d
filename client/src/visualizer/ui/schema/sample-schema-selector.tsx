import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { DatabaseSchema } from "@/shared/types/schema";
import {
  getSampleSchemas,
  getSchemaFormat,
} from "@/schemas/utils/load-schemas";
import { parseSchema } from "@/schemas/parsers";

interface SampleSchemaSelectorProps {
  currentInput: string;
  onSelect: (schema: DatabaseSchema) => void;
}

function formatBadgeLabel(format: string): string {
  if (format === "mermaid") return "Mermaid";
  if (format === "drawdb") return "DrawDB";
  return "SQL";
}

/**
 * Dropdown for selecting a sample schema.
 */
export function SampleSchemaSelector({
  currentInput,
  onSelect,
}: SampleSchemaSelectorProps) {
  const samples = useMemo(() => getSampleSchemas(), []);

  const selectedName = useMemo(() => {
    if (!currentInput.trim()) return "";

    const parsed = parseSchema(currentInput);
    if (!parsed) return "";

    const parsedTableNames = new Set(parsed.tables.map((t) => t.name).sort());

    for (const schema of samples) {
      const schemaTableNames = new Set(schema.tables.map((t) => t.name).sort());
      if (
        parsedTableNames.size === schemaTableNames.size &&
        Array.from(parsedTableNames).every((name) => schemaTableNames.has(name))
      ) {
        return schema.name;
      }
    }

    return "";
  }, [currentInput, samples]);

  return (
    <div className="w-full">
      <label
        htmlFor="sample-schema-select"
        className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2"
      >
        Sample schema
      </label>
      <div className="relative">
        <select
          id="sample-schema-select"
          value={selectedName}
          onChange={(e) => {
            const schema = samples.find((s) => s.name === e.target.value);
            if (schema) onSelect(schema);
          }}
          className="w-full appearance-none h-9 rounded-md border border-slate-700 bg-slate-800 text-white text-sm pl-3 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="" disabled>
            Select a sample…
          </option>
          {samples.map((schema) => {
            const tableCount = schema.tables.filter((t) => !t.isView).length;
            const viewCount = schema.tables.filter((t) => t.isView).length;
            const sourceFormat = getSchemaFormat(schema.name);
            const views =
              viewCount > 0
                ? `, ${viewCount} ${viewCount === 1 ? "view" : "views"}`
                : "";
            return (
              <option key={schema.name} value={schema.name}>
                {schema.name} ({formatBadgeLabel(sourceFormat)} · {tableCount}{" "}
                {tableCount === 1 ? "table" : "tables"}
                {views})
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>
    </div>
  );
}
