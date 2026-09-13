import { useRef, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui-components/tooltip";
import type { SchemaFormat } from "@/schemas/parsers";
import { parseSchema } from "@/schemas/parsers";
import { useToast } from "@/shared/ui-components/toast";
import {
  isAcceptedSchemaUploadFilename,
  SCHEMA_UPLOAD_ACCEPT,
} from "./schema-upload-utils";

interface FileUploadButtonProps {
  onFileLoad: (content: string, format: SchemaFormat) => void;
}

/**
 * Component for uploading schema files (SQL, Mermaid, DrawDB JSON/.ddb)
 */
export function FileUploadButton({ onFileLoad }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAcceptedSchemaUploadFilename(file.name)) {
      toast.error("Please upload a .sql, .mmd, .mermaid, .json, or .ddb file");
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
        accept={SCHEMA_UPLOAD_ACCEPT}
        onChange={handleFileUpload}
        className="hidden"
      />
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={handleClick}
              aria-label="Upload schema file"
            >
              <Upload size={18} className="sm:w-5 sm:h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="bg-slate-800 text-white border-slate-700"
          >
            Upload schema file
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
