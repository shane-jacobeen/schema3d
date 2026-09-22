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
import { useVisualizerStateContext } from "@/visualizer/3d/context/visualizer-state-context";

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

export function SchemaOverlay() {
  const {
    schemaState,
    selectionState,
    layoutState,
    filterState,
    cameraState,
    glCanvasRef,
    detailsPanelRef,
    handleTableClose,
    handleRelationshipClose,
  } = useVisualizerStateContext();

  const schema = schemaState.currentSchema;
  const selectedTable = selectionState.selectedTable;
  const selectedRelationship = selectionState.selectedRelationship;

  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(
    shouldShowWelcomeOverlay
  );

  const viewState = useCollectViewState(
    filterState.selectedCategories,
    layoutState.currentLayout,
    layoutState.viewMode,
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

      <div className="absolute top-2 right-[96px] sm:top-4 sm:right-16 sm:w-64">
        <SearchFilter
          tables={schema.tables}
          onFilter={filterState.handleFilter}
        />
      </div>

      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-2">
        <Card className="bg-slate-900/70 border-slate-700 text-white backdrop-blur-sm p-2 sm:p-4 min-w-[164px] sm:min-w-[200px] pb-2 sm:pb-3">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-lg font-bold truncate max-w-[150px] sm:max-w-none">
              {schema.name + " Schema"}
            </h2>
            <SchemaSelector
              currentSchema={schema}
              onSchemaChange={(newSchema) =>
                schemaState.handleSchemaChangeFromSelector(newSchema, (s) =>
                  filterState.resetCategories(s)
                )
              }
              persistedSchemaRef={schemaState.persistedSchemaRef}
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mb-0">
            {schema.tables.filter((t) => !t.isView).length} tables
            {schema.tables.filter((t) => t.isView).length > 0 && (
              <>, {schema.tables.filter((t) => t.isView).length} views</>
            )}
          </p>
        </Card>
        <div className="text-[10px] sm:text-xs text-slate-400 px-1 flex gap-2">
          <Link
            to="/topics/sql"
            className="hover:text-blue-300 transition-colors"
          >
            SQL
          </Link>
          <span>•</span>
          <Link
            to="/topics/mermaid"
            className="hover:text-blue-300 transition-colors"
          >
            Mermaid
          </Link>
          <span>•</span>
          <Link
            to="/topics/drawdb"
            className="hover:text-blue-300 transition-colors"
          >
            DrawDB
          </Link>
        </div>
      </div>

      <LayoutControls
        schema={schema}
        onSchemaChange={schemaState.setCurrentSchema}
        currentLayout={layoutState.currentLayout}
        onLayoutChange={layoutState.handleLayoutChange}
        viewMode={layoutState.viewMode}
        onViewModeChange={layoutState.setViewMode}
        selectedCategories={filterState.selectedCategories}
        onCategoryToggle={filterState.handleCategoryToggle}
      />

      <div className="absolute top-2 right-[52px] bottom-auto left-auto sm:right-auto sm:bottom-safe-bottom-lg sm:left-1/2 sm:-translate-x-1/2 sm:top-auto z-10">
        <Button
          onClick={cameraState.handleRecenter}
          variant="outline"
          size="icon"
          className="w-9 h-9 sm:w-10 sm:h-10"
          title="Re-center camera"
        >
          <Compass size={18} className="sm:w-5 sm:h-5" />
        </Button>
      </div>

      <div className="absolute bottom-safe-bottom right-2 sm:bottom-safe-bottom-lg sm:right-4 flex flex-col gap-2">
        <ShareButton
          schemaText={schemaToFormat(schema)}
          format={schema.format}
          viewState={viewState}
          variant="outline"
          size="sm"
        />
        <ExportControls schema={schema} canvasRef={glCanvasRef} />
      </div>

      {selectedTable && (
        <div ref={detailsPanelRef}>
          <TableInfo table={selectedTable} onClose={handleTableClose} />
        </div>
      )}

      {selectedRelationship && (
        <div ref={detailsPanelRef}>
          <RelationshipInfo
            relationship={selectedRelationship}
            onClose={handleRelationshipClose}
          />
        </div>
      )}
    </>
  );
}
