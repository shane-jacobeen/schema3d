import { X } from "lucide-react";
import { Button } from "./button";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function PanelHeader({ title, subtitle, onClose }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-xl font-bold text-white truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      <Button
        onClick={onClose}
        variant="closeButton"
        size="icon-close"
        aria-label="Close"
      >
        <X size={18} className="sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
}
