import { Image, FileSpreadsheet } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import { Card } from "@/shared/ui-components/card";
import type { DatabaseSchema } from "@/shared/types/schema";
import { escapeCSV, downloadFile, generateTimestamp } from "./export-utils";

interface ExportControlsProps {
  schema: DatabaseSchema;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export function ExportControls({ schema, canvasRef }: ExportControlsProps) {
  const exportScreenshot = () => {
    if (!canvasRef?.current) {
      console.error("Canvas not available for screenshot");
      return;
    }

    try {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const filename = `${schema.name.replace(/\s+/g, "_")}_screenshot.png`;
          downloadFile(blob, filename, "image/png");
        }
      }, "image/png");
    } catch (error) {
      console.error("Screenshot export failed:", error);
    }
  };

  const exportToCSV = () => {
    try {
      // Build CSV content
      const csvRows: string[] = [];

      // Content header
      csvRows.push(
        "Table Name,Column Name,Data Type,Primary Key,Foreign Key,References Table,References Column,Category"
      );

      schema.tables.forEach((table) => {
        table.columns.forEach((column) => {
          const row = [
            table.name,
            column.name,
            column.type,
            column.isPrimaryKey ? "Yes" : "No",
            column.isForeignKey ? "Yes" : "No",
            column.references?.table || "",
            column.references?.column || "",
            table.category || "",
          ];
          csvRows.push(row.map(escapeCSV).join(","));
        });
      });

      csvRows.push(""); // Empty line

      // Create and download CSV file
      const csvContent = csvRows.join("\n");
      const filename = `${schema.name.replace(
        /\s+/g,
        "_"
      )}_schema_${generateTimestamp()}.csv`;
      downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  };

  return (
    <Card className="bg-slate-900/70 border-slate-700 text-white backdrop-blur-sm p-2 sm:p-3">
      <h3 className="text-xs font-semibold mb-1.5 sm:mb-2 text-slate-400 text-center">
        Export
      </h3>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={exportScreenshot}
          className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm gap-1 sm:gap-2 flex-1 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 py-2 sm:py-2.5"
          title="Export as PNG screenshot"
        >
          <Image size={12} className="hidden sm:block sm:w-3.5 sm:h-3.5" />
          <span>PNG</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={exportToCSV}
          className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm gap-1 sm:gap-2 flex-1 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 py-2 sm:py-2.5"
          title="Export schema data as CSV"
        >
          <FileSpreadsheet
            size={12}
            className="hidden sm:block sm:w-3.5 sm:h-3.5"
          />
          <span>CSV</span>
        </Button>
      </div>
    </Card>
  );
}
