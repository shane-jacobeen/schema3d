import { ToggleGroup } from "@/shared/ui-components/toggle-group";
import { CustomToggleGroupItem } from "@/shared/ui-components/custom-toggle-group-item";
import type { SchemaFormat } from "@/schemas/parsers";

interface FormatSelectorProps {
  value: SchemaFormat;
  onChange: (format: SchemaFormat) => void;
}

/**
 * Schema format selector: SQL, Mermaid, or DrawDB JSON.
 */
export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(newValue: string | undefined) => {
        if (
          newValue === "sql" ||
          newValue === "mermaid" ||
          newValue === "drawdb"
        ) {
          onChange(newValue);
        }
      }}
      variant="outline"
      className="justify-start"
    >
      <CustomToggleGroupItem value="sql" aria-label="SQL format">
        SQL
      </CustomToggleGroupItem>
      <CustomToggleGroupItem value="mermaid" aria-label="Mermaid format">
        Mermaid
      </CustomToggleGroupItem>
      <CustomToggleGroupItem value="drawdb" aria-label="DrawDB JSON format">
        DrawDB
      </CustomToggleGroupItem>
    </ToggleGroup>
  );
}
