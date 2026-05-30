import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import { Info, Compass } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import { Card } from "@/shared/ui-components/card";
import { SearchFilter } from "@/visualizer/ui/search/search-filter";
import { SchemaSelector } from "@/visualizer/ui/schema/schema-controls";
import { LayoutControls } from "@/visualizer/ui/layout/layout-controls";
import { ExportControls } from "@/visualizer/ui/export/export-controls";
import { ShareButton } from "@/visualizer/ui/schema/share-button";
import { schemaToFormat } from "@/schemas/utils/schema-converter";
import { TableInfo } from "@/visualizer/ui/panels/table-info";
import { RelationshipInfo } from "@/visualizer/ui/panels/relationship-info";
import { useCollectViewState } from "@/visualizer/state/hooks/use-collect-view-state";
import { WelcomeOverlay } from "@/visualizer/ui/welcome-overlay";
import { hasSchemaInUrl } from "@/shared/utils/url-state";
import type { DatabaseSchema, Table } from "@/shared/types/schema";
import type { Relationship } from "@/visualizer/3d/types";
import type { LayoutType } from "@/visualizer/ui/layout/layout-controls";

interface SchemaOverlayProps {
  schema: DatabaseSchema;
  selectedTable: Table | null;
  selectedRelationship: Relationship | null;
  currentLayout: LayoutType;
  viewMode: "2D" | "3D";
  selectedCategories: Set<string>;
  persistedSchemaRef: React.MutableRefObject<DatabaseSchema>;
  glCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  detailsPanelRef: React.RefObject<HTMLDivElement>;
  onSchemaChange: (newSchema: DatabaseSchema) => void;
  onSchemaChangeFromSelector: (
    newSchema: DatabaseSchema,
    onCategoriesReset?: (schema: DatabaseSchema) => void
  ) => void;
  onCategoryUpdate?: (newSchema: DatabaseSchema) => void;
  onLayoutChange: (layout: LayoutType) => void;
  onViewModeChange: (mode: "2D" | "3D") => void;
  onCategoryToggle: (category: string) => void;
  onFilter: (matched: Set<string>, related: Set<string>) => void;
  onRecenter: () => void;
  onTableClose: () => void;
  onRelationshipClose: () => void;
}

const WELCOME_DISMISSED_STORAGE_KEY = "schema3d-welcome-dismissed";

function shouldShowWelcomeOverlay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (hasSchemaInUrl()) {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(WELCOME_DISMISSED_STORAGE_KEY) !== "true"
    );
  } catch {
    return true;
  }
}

export function SchemaOverlay({
  schema,
  selectedTable,
  selectedRelationship,
  currentLayout,
  viewMode,
  selectedCategories,
  persistedSchemaRef,
  glCanvasRef,
  detailsPanelRef,
  onSchemaChange,
  onSchemaChangeFromSelector,
  onCategoryUpdate,
  onLayoutChange,
  onViewModeChange,
  onCategoryToggle,
  onFilter,
  onRecenter,
  onTableClose,
  onRelationshipClose,
}: SchemaOverlayProps) {
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(
    shouldShowWelcomeOverlay
  );

  // Collect view state including custom categories
  const viewState = useCollectViewState(
    selectedCategories,
    currentLayout,
    viewMode,
    schema
  );

  const dismissWelcomeOverlay = useCallback(() => {
    setShowWelcomeOverlay(false);

    try {
      window.localStorage.setItem(WELCOME_DISMISSED_STORAGE_KEY, "true");
    } catch {
      // Some browser modes block storage; dismissal still works for this visit.
    }
  }, []);

  return (
    <>
      {showWelcomeOverlay && (
        <WelcomeOverlay onDismiss={dismissWelcomeOverlay} />
      )}

      {/* About button */}
      <div className="absolute right-2 sm:top-4 sm:right-4 top-2 z-10">
        <Link to="/about">
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 sm:w-10 sm:h-10"
            title="About Schema3D"
          >
            <Info size={18} className="sm:w-5 sm:h-5" />
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="absolute top-2 right-[96px] sm:top-4 sm:right-16 sm:w-64">
        <SearchFilter tables={schema.tables} onFilter={onFilter} />
      </div>

      {/* Overview card at top-left */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
        <Card className="bg-slate-900/70 border-slate-700 text-white backdrop-blur-sm p-2 sm:p-4 min-w-[164px] sm:min-w-[200px] pb-2 sm:pb-3">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-lg font-bold truncate max-w-[150px] sm:max-w-none">
              {schema.name + " Schema"}
            </h2>
            <SchemaSelector
              currentSchema={schema}
              onSchemaChange={onSchemaChangeFromSelector}
              persistedSchemaRef={persistedSchemaRef}
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mb-0">
            {schema.tables.filter((t) => !t.isView).length} tables
            {schema.tables.filter((t) => t.isView).length > 0 && (
              <>, {schema.tables.filter((t) => t.isView).length} views</>
            )}
          </p>
        </Card>
      </div>

      {/* Legend and layout controls */}
      <LayoutControls
        schema={schema}
        onSchemaChange={onSchemaChange}
        onCategoryUpdate={onCategoryUpdate}
        currentLayout={currentLayout}
        onLayoutChange={onLayoutChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        selectedCategories={selectedCategories}
        onCategoryToggle={onCategoryToggle}
      />

      {/* Re-center button */}
      <div className="absolute top-2 right-[52px] bottom-auto left-auto sm:right-auto sm:bottom-safe-bottom-lg sm:left-1/2 sm:-translate-x-1/2 sm:top-auto z-10">
        <Button
          onClick={onRecenter}
          variant="outline"
          size="icon"
          className="w-9 h-9 sm:w-10 sm:h-10"
          title="Re-center camera"
        >
          <Compass size={18} className="sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Share and Export controls */}
      <div className="absolute bottom-safe-bottom right-2 sm:bottom-safe-bottom-lg sm:right-4 flex flex-col gap-2">
        {/* Share button */}
        <ShareButton
          schemaText={schemaToFormat(schema)}
          format={schema.format}
          viewState={viewState}
          variant="outline"
          size="sm"
        />

        {/* Export controls */}
        <ExportControls schema={schema} canvasRef={glCanvasRef} />
      </div>

      {/* Detail panels for elected table / relationship */}
      {selectedTable && (
        <div ref={detailsPanelRef}>
          <TableInfo table={selectedTable} onClose={onTableClose} />
        </div>
      )}

      {selectedRelationship && (
        <div ref={detailsPanelRef}>
          <RelationshipInfo
            relationship={selectedRelationship}
            onClose={onRelationshipClose}
          />
        </div>
      )}
    </>
  );
}
