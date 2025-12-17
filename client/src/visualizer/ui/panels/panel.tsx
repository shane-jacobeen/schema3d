import { Card } from "@/shared/ui-components/card";
import { PanelHeader } from "@/shared/ui-components/panel-header";

interface PanelProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Shared panel wrapper component with consistent styling and scrolling behavior
 * - Limited to 40% of screen height on small screens
 * - Limited to 80% of screen height on large screens
 * - Scrolls on overflow
 * - Consistent positioning and sizing
 */
export function Panel({ title, subtitle, onClose, children }: PanelProps) {
  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-[calc(100vw-1rem)] sm:w-80 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col z-50">
      <Card className="bg-slate-900/70 border-slate-700 text-white backdrop-blur-sm flex flex-col">
        <div className="p-3 sm:p-4 flex-shrink-0 border-b border-slate-700">
          <PanelHeader title={title} subtitle={subtitle} onClose={onClose} />
        </div>

        <div className="overflow-y-auto p-3 sm:p-4 max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-10rem)]">
          {children}
        </div>
      </Card>
    </div>
  );
}
