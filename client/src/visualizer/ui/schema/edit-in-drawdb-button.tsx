import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui-components/dialog";
import type { DatabaseSchema } from "@/shared/types/schema";
import { schemaToDrawdbText } from "@/schemas/parsers/drawdb";
import { downloadFile } from "@/visualizer/ui/export/export-utils";
import { useToast } from "@/shared/ui-components/toast";

interface EditInDrawdbButtonProps {
  /** Resolve the schema at click time (e.g. current editor contents). */
  getSchema: () => DatabaseSchema;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

const actionLinkClass =
  "font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm";

/**
 * Opens a short guide: download DrawDB JSON, then import in DrawDB
 * (DrawDB cannot receive a Schema3D diagram via URL).
 */
export function EditInDrawdbButton({
  getSchema,
  className,
  size = "sm",
}: EditInDrawdbButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const downloadForDrawdb = () => {
    try {
      const schema = getSchema();
      const json = schemaToDrawdbText(schema);
      const filename = `${schema.name.replace(/\s+/g, "_")}_drawdb.json`;
      downloadFile(json, filename, "application/json;charset=utf-8;");
      toast.success("DrawDB JSON downloaded");
    } catch (error) {
      console.error("DrawDB export failed:", error);
      toast.error("Failed to export DrawDB JSON");
    }
  };

  const openDrawdb = () => {
    window.open("https://drawdb.app/editor", "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant="outline"
          className={className}
          title="Edit this schema in DrawDB"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Edit in DrawDB</span>
          <span className="sm:hidden">DrawDB</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit in DrawDB</DialogTitle>
          <DialogDescription className="text-slate-300 text-left">
            Follow the steps below to edit this schema in DrawDB:
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal list-outside ml-5 space-y-3 text-sm text-slate-200 text-left marker:font-semibold marker:text-white">
          <li>
            <button
              type="button"
              className={actionLinkClass}
              onClick={downloadForDrawdb}
            >
              Download
            </button>{" "}
            the schema as DrawDB JSON.
          </li>
          <li>
            <button
              type="button"
              className={actionLinkClass}
              onClick={openDrawdb}
            >
              Open DrawDB
            </button>
            , then use <span className="text-white">File → Import</span> and
            select the downloaded file.
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
