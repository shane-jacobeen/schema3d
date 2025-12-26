import { useRef, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import type { SchemaFormat } from "@/schemas/parsers";
import { parseSchema } from "@/schemas/parsers";
import { useToast } from "@/shared/ui-components/toast";

interface FileUploadButtonProps {
  onFileLoad: (content: string, format: SchemaFormat) => void;
}

/**
 * Component for uploading schema files
 */
export function FileUploadButton({ onFileLoad }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      toast.error("Please upload a .sql, .mmd, or .mermaid file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          toast.error("File appears to be empty");
          return;
        }

        // Auto-detect format by parsing
        const parsed = parseSchema(content);
        const detectedFormat = parsed?.format || "sql";
        onFileLoad(content, detectedFormat);
      } catch (err) {
        toast.error(
          `Failed to process file: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };
    reader.onerror = () => {
      toast.error(
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
        size="icon"
        variant="outline"
        className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm shadow-lg w-10 h-10 sm:w-12 sm:h-12"
        onClick={handleClick}
        title="Upload Schema File"
      >
        <Upload size={18} className="sm:w-5 sm:h-5" />
      </Button>
    </>
  );
}
