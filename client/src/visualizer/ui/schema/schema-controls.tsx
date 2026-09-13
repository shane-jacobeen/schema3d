import { useState, useEffect, startTransition, useRef } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
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
import { EditInDrawdbButton } from "./edit-in-drawdb-button";

const EDITOR_SCROLLBAR_CLASS =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-500/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400/70 [scrollbar-width:thin] [scrollbar-color:rgb(100,116,139,0.5)_transparent]";

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

  // Live validation (editor only — DrawDB share URLs use the dedicated field)
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
    if (!trimmed || !isDrawdbShareUrl(trimmed)) {
      return;
    }
    if (shareFetchRef.current === trimmed) {
      return;
    }
    shareFetchRef.current = trimmed;

    setIsFetchingShare(true);
    try {
      const json = await fetchDrawdbShareJson(trimmed);
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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 p-4 sm:p-6">
        <div className="absolute right-10 top-4 z-10 sm:right-6">
          <EditInDrawdbButton
            getSchema={resolveSchemaForDrawdb}
            className="shrink-0 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
          />
        </div>
        <DialogHeader className="pr-24 sm:pr-36">
          <DialogTitle className="text-white text-base sm:text-lg">
            Select or Import Database Schema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="w-full sm:w-[40%] sm:shrink-0">
              <SampleSchemaSelector
                currentInput={scriptInput}
                format={currentFormat}
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
                placeholder="Paste https://drawdb.app/editor?shareId=…"
                disabled={isFetchingShare}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </div>
          </div>

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
                className={`h-[150px] sm:h-[275px] border border-slate-700 rounded-md bg-slate-800 text-white font-mono text-xs sm:text-sm px-3 py-2 whitespace-pre-wrap overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${EDITOR_SCROLLBAR_CLASS}`}
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
