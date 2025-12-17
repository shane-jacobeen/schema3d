import { useRef, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import type { SchemaFormat } from "@/schemas/parsers";
import { parseSchema } from "@/schemas/parsers";

interface FileUploadButtonProps {
  onFileLoad: (content: string, format: SchemaFormat) => void;
  onError: (error: string) => void;
}

/**
 * Component for uploading schema files
 */
export function FileUploadButton({
  onFileLoad,
  onError,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const fileName = file.name.toLowerCase();
    const isValidFile =
      fileName.endsWith(".sql") ||
      fileName.endsWith(".mmd") ||
      fileName.endsWith(".mermaid");
    if (!isValidFile) {
      onError("Please upload a .sql, .mmd, or .mermaid file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          onError("File appears to be empty");
          return;
        }

        // Auto-detect format by parsing
        const parsed = parseSchema(content);
        const detectedFormat = parsed?.format || "sql";
        onFileLoad(content, detectedFormat);
      } catch (err) {
        onError(
          `Failed to process file: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };
    reader.onerror = () => {
      onError(
        "Failed to read file. Please ensure the file is a valid text file."
      );
    };
    reader.readAsText(file, "UTF-8");

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,.mmd,.mermaid,.txt,text/plain,application/sql"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        size="sm"
        variant="outline"
        className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm gap-1 sm:gap-2 flex-1 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 py-2 sm:py-2.5"
        onClick={handleClick}
      >
        <Upload size={12} className="hidden sm:block sm:w-3.5 sm:h-3.5" />
        <span>Upload Schema File</span>
      </Button>
    </>
  );
}
