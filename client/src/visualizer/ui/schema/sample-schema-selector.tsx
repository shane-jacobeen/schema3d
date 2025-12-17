import { useMemo } from "react";
import { Card } from "@/shared/ui-components/card";
import { Badge } from "@/shared/ui-components/badge";
import type { DatabaseSchema } from "@/shared/types/schema";
import { getSampleSchemas } from "@/schemas/utils/load-schemas";
import { parseSchema } from "@/schemas/parsers";

interface SampleSchemaSelectorProps {
  currentInput: string;
  format: "sql" | "mermaid";
  onSelect: (schema: DatabaseSchema) => void;
}

/**
 * Component for selecting sample schemas
 */
export function SampleSchemaSelector({
  currentInput,
  format: _format,
  onSelect,
}: SampleSchemaSelectorProps) {
  // Determine which schema matches the current input
  const selectedSchema = useMemo(() => {
    if (!currentInput.trim()) return null;

    // Auto-detect format by trying both parsers
    const parsed = parseSchema(currentInput);
    if (!parsed) return null;

    // Compare table names and counts
    const parsedTableNames = new Set(parsed.tables.map((t) => t.name).sort());

    for (const schema of getSampleSchemas()) {
      const schemaTableNames = new Set(schema.tables.map((t) => t.name).sort());
      if (
        parsedTableNames.size === schemaTableNames.size &&
        Array.from(parsedTableNames).every((name) => schemaTableNames.has(name))
      ) {
        return schema;
      }
    }

    return null;
  }, [currentInput]);

  return (
    <div className="w-full">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
        Sample Schemas
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
        {getSampleSchemas().map((schema) => {
          const isSelected = selectedSchema?.name === schema.name;
          const tableCount = schema.tables.filter((t) => !t.isView).length;
          const viewCount = schema.tables.filter((t) => t.isView).length;
          return (
            <Card
              key={schema.name}
              className={`p-3 sm:p-4 cursor-pointer transition-all w-full ${
                isSelected
                  ? "bg-blue-500/20 border-blue-500"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
              }`}
              onClick={() => onSelect(schema)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white text-sm sm:text-base truncate">
                      {schema.name}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 ${
                        schema.format === "mermaid"
                          ? "border-purple-500 text-purple-400"
                          : "border-blue-500 text-blue-400"
                      }`}
                    >
                      {schema.format === "mermaid" ? "Mermaid" : "SQL"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {tableCount} {tableCount === 1 ? "table" : "tables"}
                    {viewCount > 0 && (
                      <>
                        , {viewCount} {viewCount === 1 ? "view" : "views"}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
