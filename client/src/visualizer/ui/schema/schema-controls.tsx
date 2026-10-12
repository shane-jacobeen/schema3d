import { useState, useEffect, startTransition, useRef } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import { Badge } from "@/shared/ui-components/badge";
import { Input } from "@/shared/ui-components/input";
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
import {
  parseSchema,
  validateAndParse,
  type SchemaFormat,
} from "@/schemas/parsers";
import {
  parseDrawdbShareId,
  fetchDrawdbShareJson,
  DrawdbShareError,
} from "@/schemas/parsers/drawdb";
import {
  getEditorTextForSchema,
  resolveSchemaFormat,
} from "./schema-editor-text";
import { SchemaEditor } from "./schema-editor";
import { SampleSchemaSelector } from "./sample-schema-selector";
import { FileUploadButton } from "./file-upload-button";
import { EditInDrawdbButton } from "./edit-in-drawdb-button";
import {
  noteSchemaInputRoute,
  type SchemaInputRoute,
} from "@/shared/analytics";

function formatBadgeLabel(format: SchemaFormat): string {
  if (format === "mermaid") return "Mermaid";
  if (format === "drawdb") return "DrawDB";
  return "SQL";
}

function formatBadgeClass(format: SchemaFormat): string {
  if (format === "mermaid") {
    return "border-purple-500/60 bg-purple-500/10 text-purple-300";
  }
  if (format === "drawdb") {
    return "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
  }
  return "border-blue-500/60 bg-blue-500/10 text-blue-300";
}

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
  const [drawdbShareInput, setDrawdbShareInput] = useState("");
  const [isFetchingShare, setIsFetchingShare] = useState(false);
  const { toast } = useToast();
  const shareFetchRef = useRef<string | null>(null);
  const inputRouteRef = useRef<SchemaInputRoute>("paste");

  // Initialize dialog when it opens
  useEffect(() => {
    if (isOpen) {
      inputRouteRef.current = "paste";
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
          setDrawdbShareInput("");
          shareFetchRef.current = null;

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

  // Live validation — detect format from editor contents
  useEffect(() => {
    if (!scriptInput.trim()) {
      startTransition(() => setIsValid(false));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      // Prefer the selected format, then fall back to auto-detect (e.g. paste)
      let result = validateAndParse(scriptInput, currentFormat);
      if (!result.isValid) {
        const auto = validateAndParse(scriptInput);
        if (auto.isValid) {
          result = auto;
        }
      }

      startTransition(() => {
        setIsValid(result.isValid);

        if (result.schema) {
          const schema = result.schema;
          const preservedName = persistedSchemaRef.current?.name;
          const shouldPreserveName =
            preservedName && preservedName !== "Custom Database";

          const name = shouldPreserveName ? preservedName : schema.name;

          persistedSchemaRef.current = {
            ...schema,
            name,
            format: schema.format,
          };
          setCurrentFormat((prevFormat) => {
            return schema.format !== prevFormat ? schema.format : prevFormat;
          });
        }
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptInput, currentFormat]);

  const handleSampleSelect = (schema: DatabaseSchema) => {
    inputRouteRef.current = "sample";
    const format = resolveSchemaFormat(schema);
    const migrated: DatabaseSchema = { ...schema, format };
    persistedSchemaRef.current = migrated;
    setCurrentFormat(format);
    setScriptInput(getEditorTextForSchema(migrated));
    setDrawdbShareInput("");
    shareFetchRef.current = null;
  };

  const loadDrawdbShare = async (raw: string) => {
    const trimmed = raw.trim();
    // Accept drawdb.app URLs or bare gist IDs (same as ?drawdbShareId=)
    if (!trimmed || !parseDrawdbShareId(trimmed)) {
      return;
    }
    if (shareFetchRef.current === trimmed) {
      return;
    }
    shareFetchRef.current = trimmed;

    setIsFetchingShare(true);
    try {
      const json = await fetchDrawdbShareJson(trimmed);
      inputRouteRef.current = "paste";
      setScriptInput(json);
      setCurrentFormat("drawdb");
      toast.success("Loaded schema from DrawDB share");
    } catch (err) {
      shareFetchRef.current = null;
      const message =
        err instanceof DrawdbShareError
          ? err.message
          : "Failed to load DrawDB share. Export JSON from DrawDB and import the file instead.";
      toast.error(message);
    } finally {
      setIsFetchingShare(false);
    }
  };

  const handleOk = () => {
    const parsed =
      parseSchema(scriptInput, currentFormat) || parseSchema(scriptInput);

    if (parsed && parsed.tables.length > 0) {
      const name = persistedSchemaRef.current?.name || parsed.name;

      const schemaWithName = {
        ...parsed,
        name,
        format: currentFormat || parsed.format,
      };

      persistedSchemaRef.current = schemaWithName;
      noteSchemaInputRoute(inputRouteRef.current);
      onSchemaChange(schemaWithName);
      setIsOpen(false);
    } else {
      toast.error(
        `Failed to parse schema. Please ensure you're using valid SQL, Mermaid, or DrawDB JSON.`
      );
    }
  };

  const handleFileLoad = (content: string, detectedFormat: SchemaFormat) => {
    inputRouteRef.current = "upload";
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

  const resolveSchemaForDrawdb = (): DatabaseSchema => {
    return (
      parseSchema(scriptInput, currentFormat) ||
      parseSchema(scriptInput) ||
      persistedSchemaRef.current ||
      currentSchema
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <DialogContent className="flex h-[90vh] max-h-[90vh] max-w-[95vw] flex-col gap-4 overflow-hidden bg-slate-900 border-slate-700 p-4 sm:h-[80vh] sm:max-h-[80vh] sm:max-w-2xl sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-white text-base sm:text-lg">
            Select or Import Database Schema
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="w-full sm:w-[40%] sm:shrink-0">
              <SampleSchemaSelector
                currentInput={scriptInput}
                onSelect={handleSampleSelect}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <label
                htmlFor="drawdb-share-input"
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300"
              >
                DrawDB share link
                {isFetchingShare && (
                  <Loader2
                    size={14}
                    className="animate-spin text-slate-400"
                    aria-label="Loading DrawDB share"
                  />
                )}
              </label>
              <Input
                id="drawdb-share-input"
                value={drawdbShareInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setDrawdbShareInput(value);
                  void loadDrawdbShare(value);
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text/plain");
                  if (pasted.trim()) {
                    setDrawdbShareInput(pasted);
                    void loadDrawdbShare(pasted);
                  }
                }}
                placeholder="Paste drawdb.app link or gist ID…"
                disabled={isFetchingShare}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <Badge
              variant="outline"
              className={`pointer-events-none absolute top-2 right-2 z-10 px-2 py-0.5 ${formatBadgeClass(currentFormat)}`}
              title="Detected schema format"
            >
              {formatBadgeLabel(currentFormat)}
            </Badge>
            <SchemaEditor
              value={scriptInput}
              format={currentFormat}
              onChange={(newValue) => {
                inputRouteRef.current = "paste";
                setScriptInput(newValue);
              }}
              className="h-full min-h-[120px] border border-slate-700 rounded-md bg-slate-800 text-white font-mono text-xs sm:text-sm px-3 pt-8 pb-2 pr-16 whitespace-pre-wrap overflow-hidden focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            />
            <LocalToastContainer />
            <div className="absolute bottom-2 right-2 flex flex-col gap-2">
              <EditInDrawdbButton getSchema={resolveSchemaForDrawdb} />
              <FileUploadButton onFileLoad={handleFileLoad} />
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-0 sm:pt-0">
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
