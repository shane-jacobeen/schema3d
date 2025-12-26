import { useState, useEffect, useRef, startTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import { useToast, LocalToastContainer } from "@/shared/ui-components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/ui-components/dialog";
import type { DatabaseSchema } from "@/shared/types/schema";
import { areSchemasEqual } from "@/visualizer/state/utils/schema-utils";
import { getSchemaText } from "@/schemas/utils/load-schemas";
import { schemaToFormat } from "@/schemas/utils/schema-converter";
import {
  parseSchema,
  validateAndParse,
  type SchemaFormat,
} from "@/schemas/parsers";
import { logSchemaAction } from "@/shared/utils/api";
import { SchemaEditor } from "./schema-editor";
import { FormatSelector } from "./format-selector";
import { SampleSchemaSelector } from "./sample-schema-selector";
import { FileUploadButton } from "./file-upload-button";

interface SchemaSelectorProps {
  currentSchema: DatabaseSchema;
  onSchemaChange: (schema: DatabaseSchema) => void;
  persistedSchemaRef: React.MutableRefObject<DatabaseSchema>;
}

export function SchemaSelector({
  currentSchema,
  onSchemaChange,
  persistedSchemaRef,
}: SchemaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scriptInput, setScriptInput] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<SchemaFormat>("sql");
  const initialSchemaRef = useRef<DatabaseSchema | null>(null);
  const { toast } = useToast();

  // Update format when user explicitly selects format via FormatSelector
  const updateFormat = (newFormat: SchemaFormat) => {
    setCurrentFormat(newFormat);
    // Parse with the explicitly selected format
    const parsed = parseSchema(scriptInput, newFormat);
    if (parsed) {
      persistedSchemaRef.current = parsed;
    } else if (persistedSchemaRef.current) {
      // If parsing fails but we have a schema, update the format field
      persistedSchemaRef.current = {
        ...persistedSchemaRef.current,
        format: newFormat,
      };
    }
  };

  // Initialize dialog when it opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Store initial schema for comparison
          initialSchemaRef.current =
            persistedSchemaRef.current || currentSchema;

          // Convert persisted schema to selected format for display
          const scriptToLoad = schemaToFormat(
            persistedSchemaRef.current || currentSchema
          );
          setScriptInput(scriptToLoad);

          // Set format from persisted schema or default
          const format = persistedSchemaRef.current?.format || "sql";
          setCurrentFormat(format);

          // Validate - auto-detect format by trying both parsers
          const result = validateAndParse(scriptToLoad);
          setIsValid(result.isValid);
          // Update persisted schema with detected format if valid
          if (result.schema) {
            persistedSchemaRef.current = result.schema;
            setCurrentFormat(result.schema.format);
          }
        });
      });
    }
    // persistedSchemaRef is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSchema]);

  // Live validation - runs on every text change
  // Auto-detects format by trying both parsers
  useEffect(() => {
    // Auto-detect format by trying both parsers
    const result = !scriptInput.trim()
      ? { isValid: false, schema: null }
      : validateAndParse(scriptInput);

    // Use startTransition to batch state updates and avoid cascading renders
    startTransition(() => {
      setIsValid(result.isValid);

      // Update persisted schema if valid (includes detected format)
      // Only update format state if it actually changed to avoid unnecessary re-renders
      if (result.schema) {
        const schema = result.schema;
        persistedSchemaRef.current = schema;
        // Only update format if it's different from current to prevent re-render loops
        setCurrentFormat((prevFormat) => {
          return schema.format !== prevFormat ? schema.format : prevFormat;
        });
      }
    });
    // persistedSchemaRef is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptInput]);

  const handleSampleSelect = (schema: DatabaseSchema) => {
    persistedSchemaRef.current = schema;
    const text = getSchemaText(schema.name) || schemaToFormat(schema);
    setScriptInput(text);
  };

  const handleOk = () => {
    // Auto-detect format by trying both parsers
    const parsed = parseSchema(scriptInput);

    if (parsed && parsed.tables.length > 0) {
      // Check if schema changed
      if (
        !initialSchemaRef.current ||
        !areSchemasEqual(parsed, initialSchemaRef.current)
      ) {
        logSchemaAction("schema_change").catch(() => {});
      }

      persistedSchemaRef.current = parsed;
      onSchemaChange(parsed);
      setIsOpen(false);
    } else {
      toast.error(
        `Failed to parse schema. Please ensure you're using valid SQL or Mermaid syntax.`
      );
    }
  };

  const handleFileLoad = (content: string, detectedFormat: SchemaFormat) => {
    setScriptInput(content);
    // Try parsing with the detected format first, then fall back to auto-detect
    const parsed = parseSchema(content, detectedFormat) || parseSchema(content);
    if (parsed) {
      persistedSchemaRef.current = parsed;
    }
    toast.success("File loaded successfully");
    logSchemaAction("schema_upload").catch(() => {});
  };

  const handleOpenChange = (open: boolean) => {
    // When closing via clickaway or X button, don't apply changes
    // Keep the SQL input persisted in memory
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0"
          title="Change Schema"
        >
          <Pencil size={14} className="sm:w-4 sm:h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white text-base sm:text-lg">
            Select or Import Database Schema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <SampleSchemaSelector
            currentInput={scriptInput}
            format={currentFormat}
            onSelect={handleSampleSelect}
          />

          <div className="border-t border-slate-700 pt-4 sm:pt-6">
            <div className="mb-2 sm:mb-3">
              <FormatSelector value={currentFormat} onChange={updateFormat} />
            </div>
            <div className="relative">
              <SchemaEditor
                value={scriptInput}
                format={currentFormat}
                onChange={(newValue) => {
                  setScriptInput(newValue);
                }}
                className="h-[150px] sm:h-[275px] border border-slate-700 rounded-md bg-slate-800 text-white font-mono text-xs sm:text-sm px-3 py-2 whitespace-pre-wrap overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <LocalToastContainer />
              <div className="absolute bottom-2 right-2">
                <FileUploadButton onFileLoad={handleFileLoad} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-3 sm:pt-4">
          <Button
            onClick={handleOk}
            disabled={!isValid || !scriptInput.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base"
            size="lg"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
