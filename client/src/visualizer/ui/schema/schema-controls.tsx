import { useState, useEffect, startTransition, useRef } from "react";
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
import { getSchemaText } from "@/schemas/utils/load-schemas";
import { schemaToFormat } from "@/schemas/utils/schema-converter";
import {
  parseSchema,
  validateAndParse,
  type SchemaFormat,
} from "@/schemas/parsers";
import {
  isDrawdbShareUrl,
  fetchDrawdbShareJson,
  DrawdbShareError,
} from "@/schemas/parsers/drawdb";
import {
  getEditorTextForSchema,
  resolveSchemaFormat,
} from "./schema-editor-text";
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
  const [isFetchingShare, setIsFetchingShare] = useState(false);
  const { toast } = useToast();
  const shareFetchRef = useRef<string | null>(null);

  // Explicit format toggle: convert current schema into the target format text
  const updateFormat = (newFormat: SchemaFormat) => {
    const base =
      persistedSchemaRef.current || parseSchema(scriptInput) || currentSchema;

    // Preserve tables; rewrite format + editor text
    const withFormat: DatabaseSchema = { ...base, format: newFormat };
    const text =
      newFormat === "drawdb" && base.name === "Blog Platform"
        ? getSchemaText("Blog Platform") || schemaToFormat(withFormat)
        : schemaToFormat(withFormat);

    setCurrentFormat(newFormat);
    setScriptInput(text);
    persistedSchemaRef.current = withFormat;

    const parsed = parseSchema(text, newFormat) || parseSchema(text);
    if (parsed) {
      persistedSchemaRef.current = {
        ...parsed,
        name: base.name || parsed.name,
        format: newFormat,
      };
    }
  };

  // Initialize dialog when it opens — migrate Blog Platform content to JSON
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const schema = persistedSchemaRef.current || currentSchema;
          const format = resolveSchemaFormat(schema);
          const scriptToLoad = getEditorTextForSchema({
            ...schema,
            format,
          });

          setScriptInput(scriptToLoad);
          setCurrentFormat(format);

          // Keep persisted schema on drawdb when opening Blog Platform
          if (schema.name === "Blog Platform" && schema.format !== "drawdb") {
            persistedSchemaRef.current = { ...schema, format: "drawdb" };
          }

          const result = validateAndParse(scriptToLoad, format);
          setIsValid(result.isValid);
          if (result.schema) {
            persistedSchemaRef.current = {
              ...result.schema,
              name: schema.name || result.schema.name,
              format,
            };
            setCurrentFormat(format);
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSchema]);

  // Resolve pasted DrawDB share URLs → gist JSON (async)
  useEffect(() => {
    const trimmed = scriptInput.trim();
    if (!trimmed || !isDrawdbShareUrl(trimmed)) {
      return;
    }

    if (shareFetchRef.current === trimmed) {
      return;
    }
    shareFetchRef.current = trimmed;

    let cancelled = false;
    setIsFetchingShare(true);

    (async () => {
      try {
        const json = await fetchDrawdbShareJson(trimmed);
        if (cancelled) return;
        setScriptInput(json);
        setCurrentFormat("drawdb");
        toast.success("Loaded schema from DrawDB share");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof DrawdbShareError
            ? err.message
            : "Failed to load DrawDB share. Export JSON from DrawDB and import the file instead.";
        toast.error(message);
        shareFetchRef.current = null;
      } finally {
        if (!cancelled) {
          setIsFetchingShare(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scriptInput, toast]);

  // Live validation - debounced to avoid parsing on every keystroke
  useEffect(() => {
    if (isDrawdbShareUrl(scriptInput)) {
      startTransition(() => {
        setIsValid(false);
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const result = !scriptInput.trim()
        ? { isValid: false, schema: null }
        : validateAndParse(scriptInput, currentFormat);

      startTransition(() => {
        setIsValid(result.isValid);

        if (result.schema) {
          const schema = result.schema;
          const preservedName = persistedSchemaRef.current?.name;
          const shouldPreserveName =
            preservedName && preservedName !== "Custom Database";

          const name = shouldPreserveName ? preservedName : schema.name;
          // Blog Platform sample must stay drawdb/JSON internally
          const format: SchemaFormat =
            name === "Blog Platform" ? "drawdb" : schema.format;

          persistedSchemaRef.current = {
            ...schema,
            name,
            format,
          };
          setCurrentFormat((prevFormat) => {
            return format !== prevFormat ? format : prevFormat;
          });
        }
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptInput, currentFormat]);

  const handleSampleSelect = (schema: DatabaseSchema) => {
    const format = resolveSchemaFormat(schema);
    const migrated: DatabaseSchema = { ...schema, format };
    persistedSchemaRef.current = migrated;
    setCurrentFormat(format);
    setScriptInput(getEditorTextForSchema(migrated));
  };

  const handleOk = () => {
    const parsed = parseSchema(scriptInput, currentFormat);

    if (parsed && parsed.tables.length > 0) {
      const name = persistedSchemaRef.current?.name || parsed.name;
      const format: SchemaFormat =
        name === "Blog Platform" ? "drawdb" : parsed.format;

      const schemaWithName = {
        ...parsed,
        name,
        format,
      };

      persistedSchemaRef.current = schemaWithName;
      onSchemaChange(schemaWithName);
      setIsOpen(false);
    } else {
      toast.error(
        `Failed to parse schema. Please ensure you're using valid SQL, Mermaid, or DrawDB JSON.`
      );
    }
  };

  const handleFileLoad = (content: string, detectedFormat: SchemaFormat) => {
    setScriptInput(content);
    setCurrentFormat(detectedFormat);
    // Try parsing with the detected format first, then fall back to auto-detect
    const parsed = parseSchema(content, detectedFormat) || parseSchema(content);
    if (parsed) {
      persistedSchemaRef.current = parsed;
      setCurrentFormat(parsed.format);
    }
    toast.success("File loaded successfully");
  };

  const handleOpenChange = (open: boolean) => {
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
            {isFetchingShare && (
              <p className="mt-2 text-xs text-slate-400">
                Loading DrawDB share…
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="pt-3 sm:pt-4">
          <Button
            onClick={handleOk}
            disabled={!isValid || !scriptInput.trim() || isFetchingShare}
            variant="primary"
            className="w-full"
            size="lg"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
