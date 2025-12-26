import { Helmet } from "react-helmet-async";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  Suspense,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ComponentRef,
} from "react";
import { Link } from "react-router-dom";
import { Table3D } from "./tables/table-3d";
import { RelationshipLines } from "./relationships/relationship-lines";
import type { Relationship } from "../types";
import {
  animateCameraZoom,
  calculateMaxCameraDistance,
  calculateCameraPositionForRecenter,
  getConnectedTables,
  shouldDimTable,
  isTableInRelationship,
} from "../index";
import { ViewControls } from "@/visualizer/3d/controls/view-controls";
import { SchemaSelector } from "@/visualizer/ui/schema/schema-controls";
import { TableInfo } from "@/visualizer/ui/panels/table-info";
import { RelationshipInfo } from "@/visualizer/ui/panels/relationship-info";
import { SearchFilter } from "@/visualizer/ui/search/search-filter";
import { ExportControls } from "@/visualizer/ui/export/export-controls";
import { CameraController } from "@/visualizer/3d/controls/camera-controller";
import { StatsDisplay } from "@/visualizer/ui/stats/stats-display";
import { type Table, type DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";
import type { LayoutType } from "@/visualizer/3d/controls/view-controls";
import {
  applyLayoutToSchema,
  clearSelections,
} from "@/schemas/utils/schema-utils";
import { Info, Compass } from "lucide-react";
import { Button } from "@/shared/ui-components/button";
import { Card } from "@/shared/ui-components/card";

/**
 * Main 3D schema visualization component.
 *
 * Renders database schemas as interactive 3D objects using React Three Fiber.
 * Features include:
 * - Interactive 3D table rendering with color-coded categories
 * - Relationship lines with ERD-style cardinality notation
 * - Multiple layout algorithms (circular, force-directed, hierarchical)
 * - 2D/3D view modes
 * - Table and relationship selection with detail panels
 * - Search/filter functionality
 * - Camera controls with auto-recentering
 * - Schema switching with format auto-detection (SQL/Mermaid)
 *
 * State management:
 * - Manages schema state, selections, filters, and camera animation
 * - Persists schema across dialog opens/closes
 * - Handles table position animations when switching layouts or view modes
 */
export function SchemaVisualizer() {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentSchema, setCurrentSchema] =
    useState<DatabaseSchema>(getRetailerSchema());
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<Relationship | null>(null);
  const [hoveredRelationship, setHoveredRelationship] =
    useState<Relationship | null>(null);
  const [filteredTables, setFilteredTables] = useState<Set<string>>(new Set());
  const [relatedTables, setRelatedTables] = useState<Set<string>>(new Set());
  // Track selected categories for filtering - initialized with all categories
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => {
      const initialSchema = getRetailerSchema();
      const categories = new Set<string>();
      initialSchema.tables.forEach((table) => {
        categories.add(table.category);
      });
      return categories;
    }
  );
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const [recenterTarget, setRecenterTarget] = useState<THREE.Vector3 | null>(
    null
  );
  const [recenterLookAt, setRecenterLookAt] = useState<THREE.Vector3 | null>(
    null
  );
  const [recenterTranslateOnly, setRecenterTranslateOnly] = useState(false);
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>("force");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const detailsPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justLongPressedRef = useRef(false);
  // Persist schema at container level so it persists across dialog opens/closes
  // Initialize with the current schema
  const persistedSchemaRef = useRef<DatabaseSchema>(getRetailerSchema());

  // Animation state for table repositioning
  const [targetPositions, setTargetPositions] = useState<
    Map<string, [number, number, number]>
  >(new Map());
  const [animatedPositions, setAnimatedPositions] = useState<
    Map<string, [number, number, number]>
  >(new Map());
  const animationStartTimeRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  // Use ref to batch position updates during animation to reduce re-renders
  const animatedPositionsRef = useRef<Map<string, [number, number, number]>>(
    new Map()
  );
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to apply a layout algorithm to a schema
  const applyLayout = useCallback(
    (
      schema: DatabaseSchema,
      layout: LayoutType,
      mode: "2D" | "3D" = viewMode
    ): DatabaseSchema => {
      return applyLayoutToSchema(schema, layout, mode);
    },
    [viewMode]
  );

  // Helper function to start table animation when view mode or layout changes
  const startTableAnimation = useCallback((schemaLayout: DatabaseSchema) => {
    // Cancel any pending animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Get current schema positions as starting points
    setCurrentSchema((prevSchema) => {
      // Initialize animatedPositions with current table positions
      const initialPositions = new Map<string, [number, number, number]>();
      prevSchema.tables.forEach((table) => {
        initialPositions.set(table.name, table.position);
      });

      animatedPositionsRef.current = initialPositions;
      setAnimatedPositions(new Map(initialPositions));

      // Set target positions from the new layout
      const newTargetPositions = new Map<string, [number, number, number]>();
      schemaLayout.tables.forEach((table) => {
        newTargetPositions.set(table.name, table.position);
      });
      setTargetPositions(newTargetPositions);
      animationStartTimeRef.current = Date.now();
      isAnimatingRef.current = true;

      // Update schema after animation completes
      animationTimeoutRef.current = setTimeout(() => {
        // Update schema with target positions from schemaLayout
        // Tables should be at exact target positions by now (Table3D snaps to exact target when progress >= 1)
        setCurrentSchema(schemaLayout);

        // Keep isAnimatingRef true until schema update is confirmed
        // This prevents RelationshipLines from flashing when it falls back to table.position
        // RelationshipLines only uses animatedPositions when isAnimatingRef is true
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Now safe to clear - schema should be updated and RelationshipLines will use table.position
            isAnimatingRef.current = false;
            animatedPositionsRef.current.clear();
            setAnimatedPositions(new Map());
            animationTimeoutRef.current = null;
          });
        });
      }, 1000);

      return prevSchema; // Don't update schema yet, wait for animation
    });
  }, []);

  // Apply force layout on initial load
  useEffect(() => {
    const forceLayoutSchema = applyLayout(
      getRetailerSchema(),
      "force",
      viewMode
    );
    setCurrentSchema(forceLayoutSchema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when viewMode changes

  // Track selected categories in a ref to avoid stale closures
  const selectedCategoriesRef = useRef<Set<string>>(selectedCategories);
  useEffect(() => {
    selectedCategoriesRef.current = selectedCategories;
  }, [selectedCategories]);

  // Reapply layout when view mode or layout changes (but not on initial mount)
  const isInitialMountRef = useRef(true);
  const prevViewModeRef = useRef<"2D" | "3D">(viewMode);
  const prevLayoutRef = useRef<LayoutType>(currentLayout);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevViewModeRef.current = viewMode;
      prevLayoutRef.current = currentLayout;
      return;
    }
    // Don't animate if layout is being changed (it will be handled by handleSchemaChange)
    if (isLayoutChangingRef.current) {
      prevViewModeRef.current = viewMode;
      prevLayoutRef.current = currentLayout;
      return;
    }

    // Only recalculate if view mode or layout actually changed
    const viewModeChanged = prevViewModeRef.current !== viewMode;
    const layoutChanged = prevLayoutRef.current !== currentLayout;

    if (viewModeChanged || layoutChanged) {
      isViewModeChangingRef.current = true;
      // Get current schema, filter to visible tables, apply new layout, and animate
      setCurrentSchema((prevSchema) => {
        // Filter to only visible tables before applying layout (use ref for current value)
        const visibleTablesForLayout = prevSchema.tables.filter((table) =>
          selectedCategoriesRef.current.has(table.category)
        );
        const filteredSchema: DatabaseSchema = {
          ...prevSchema,
          tables: visibleTablesForLayout,
        };

        // Apply layout to filtered schema
        const layoutedSchema = applyLayout(
          filteredSchema,
          currentLayout,
          viewMode
        );

        // Create a new schema with updated positions for visible tables
        // Keep hidden tables at their current positions
        const schemaLayout: DatabaseSchema = {
          ...prevSchema,
          tables: prevSchema.tables.map((table) => {
            const layoutedTable = layoutedSchema.tables.find(
              (t) => t.name === table.name
            );
            if (layoutedTable) {
              return {
                ...table,
                position: layoutedTable.position,
              };
            }
            // Keep hidden tables at their current positions
            return table;
          }),
        };

        startTableAnimation(schemaLayout);
        return prevSchema; // Don't update yet, animation will handle it
      });

      // Clear the flag after animation completes
      setTimeout(() => {
        isViewModeChangingRef.current = false;
      }, 1100); // Slightly longer than animation duration (1000ms)
    }

    prevViewModeRef.current = viewMode;
    prevLayoutRef.current = currentLayout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentLayout, startTableAnimation]);

  // Track if layout is being changed to avoid double application
  const isLayoutChangingRef = useRef(false);
  // Track if view mode is changing to prevent category filter effect from running
  const isViewModeChangingRef = useRef(false);

  // Helper function to clear all selections
  const clearAllSelections = useCallback(() => {
    const cleared = clearSelections();
    setSelectedTable(cleared.selectedTable);
    setHoveredTable(cleared.hoveredTable);
    setSelectedRelationship(cleared.selectedRelationship);
    setHoveredRelationship(cleared.hoveredRelationship);
    setFilteredTables(cleared.filteredTables);
    setRelatedTables(cleared.relatedTables);
  }, []);

  // Helper function to handle long press flag
  const setLongPressFlag = useCallback(() => {
    justLongPressedRef.current = true;
    setTimeout(() => {
      justLongPressedRef.current = false;
    }, 100);
  }, []);

  // Helper function to determine if panels should close on click
  const shouldClosePanels = useCallback(
    (target: HTMLElement): boolean => {
      // Don't close if clicking inside details panel
      const detailsPanel = detailsPanelRef.current;
      if (detailsPanel && detailsPanel.contains(target)) {
        return false;
      }

      // Don't close if clicking on UI controls (search, buttons, etc.)
      const isUIControl = target.closest(
        'button, input, [role="button"], [role="combobox"], [role="menu"], a'
      );
      if (isUIControl) {
        return false;
      }

      // Don't close if clicking on canvas (3D objects handle their own clicks)
      if (target.tagName === "CANVAS" || target.closest("canvas")) {
        return false;
      }

      // Close panels when clicking on container background
      return !!(selectedTable || selectedRelationship);
    },
    [selectedTable, selectedRelationship]
  );

  const handleRecenter = useCallback(() => {
    setRecenterTarget(null);
    setRecenterLookAt(null);
    setRecenterTranslateOnly(false); // Recenter button should rotate
    setShouldRecenter(true);
  }, []);

  const handleSchemaChange = useCallback(
    (newSchema: DatabaseSchema) => {
      // Layout change - the schema already has the layout applied
      // Animate to the new positions
      startTableAnimation(newSchema);
      clearAllSelections();
      isLayoutChangingRef.current = false;
    },
    [startTableAnimation, clearAllSelections]
  );

  const handleLayoutChange = useCallback((layout: LayoutType) => {
    isLayoutChangingRef.current = true;
    setCurrentLayout(layout);
    // The layout will be applied by ViewControls via handleSchemaChange
  }, []);

  // When schema changes from SchemaSelector, just set it directly (no animation)
  const handleSchemaChangeFromSelector = useCallback(
    (newSchema: DatabaseSchema) => {
      // Cancel any pending animations
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      // Stop any ongoing animation and clear state
      isAnimatingRef.current = false;
      animatedPositionsRef.current.clear();
      setAnimatedPositions(new Map());
      setTargetPositions(new Map());

      // Apply force layout to the new schema with current view mode
      const forceLayoutSchema = applyLayout(newSchema, "force", viewMode);

      // Set layout change flag BEFORE setting layout to prevent view mode effect
      isLayoutChangingRef.current = true;

      // Set the schema directly - no animation
      setCurrentSchema(forceLayoutSchema);
      setCurrentLayout("force");
      clearAllSelections();

      // Reset camera to default position when schema changes
      handleRecenter();

      // Clear the flag after React has processed the state updates
      // Use requestAnimationFrame to ensure it happens after the effect runs
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isLayoutChangingRef.current = false;
        });
      });
    },
    [applyLayout, viewMode, clearAllSelections, handleRecenter]
  );

  const handleRelationshipSelect = useCallback(
    (relationship: Relationship | null) => {
      setSelectedRelationship(relationship);
      // Clear table selection when relationship is selected
      if (relationship) {
        setSelectedTable(null);
      }
    },
    []
  );

  const handleTableSelect = useCallback((table: Table | null) => {
    setSelectedTable(table);
    // Clear relationship selection when table/view is selected
    if (table) {
      setSelectedRelationship(null);
    }
  }, []);

  const handleTablePositionChange = useCallback(
    (table: Table, newPosition: [number, number, number]) => {
      setCurrentSchema((prevSchema) => {
        const updatedTables = prevSchema.tables.map((t) =>
          t.name === table.name ? { ...t, position: newPosition } : t
        );
        return { ...prevSchema, tables: updatedTables };
      });
    },
    []
  );

  const handleFilter = useCallback(
    (matched: Set<string>, related: Set<string>) => {
      setFilteredTables(matched);
      setRelatedTables(related);
    },
    []
  );

  // Handle category toggle
  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Update selected categories when schema changes
  useEffect(() => {
    const categories = new Set<string>();
    currentSchema.tables.forEach((table) => {
      categories.add(table.category);
    });
    // Only add new categories, don't remove existing ones unless they don't exist in new schema
    setSelectedCategories((prev) => {
      const next = new Set<string>();
      categories.forEach((cat) => {
        if (prev.has(cat) || prev.size === 0) {
          next.add(cat);
        }
      });
      // If no categories were selected before, select all
      if (next.size === 0) {
        return categories;
      }
      return next;
    });
  }, [currentSchema]);

  // Filter tables and relationships based on selected categories
  const visibleTables = useMemo(() => {
    return currentSchema.tables.filter((table) =>
      selectedCategories.has(table.category)
    );
  }, [currentSchema.tables, selectedCategories]);

  const visibleTableNames = useMemo(() => {
    return new Set(visibleTables.map((t) => t.name));
  }, [visibleTables]);

  // Recalculate layout when category selection changes
  const prevSelectedCategoriesRef = useRef<Set<string>>(selectedCategories);
  const isInitialCategoryLoadRef = useRef(true);
  useEffect(() => {
    // Skip on initial load
    if (isInitialCategoryLoadRef.current) {
      isInitialCategoryLoadRef.current = false;
      prevSelectedCategoriesRef.current = new Set(selectedCategories);
      return;
    }

    // Don't recalculate if layout is being changed (it will be handled by handleSchemaChange)
    if (isLayoutChangingRef.current) {
      prevSelectedCategoriesRef.current = new Set(selectedCategories);
      return;
    }

    // Don't recalculate if view mode is changing (it will handle layout recalculation)
    if (isViewModeChangingRef.current) {
      prevSelectedCategoriesRef.current = new Set(selectedCategories);
      return;
    }

    // Only recalculate if categories actually changed
    const categoriesChanged =
      prevSelectedCategoriesRef.current.size !== selectedCategories.size ||
      Array.from(prevSelectedCategoriesRef.current).some(
        (cat) => !selectedCategories.has(cat)
      ) ||
      Array.from(selectedCategories).some(
        (cat) => !prevSelectedCategoriesRef.current.has(cat)
      );

    if (categoriesChanged && visibleTables.length > 0) {
      // Create a filtered schema with only visible tables
      const filteredSchema: DatabaseSchema = {
        ...currentSchema,
        tables: visibleTables,
      };

      // Apply current layout to filtered schema
      const layoutedSchema = applyLayout(
        filteredSchema,
        currentLayout,
        viewMode
      );

      // Create a new schema with updated positions for visible tables
      // Keep hidden tables at their current positions
      const updatedSchema: DatabaseSchema = {
        ...currentSchema,
        tables: currentSchema.tables.map((table) => {
          const layoutedTable = layoutedSchema.tables.find(
            (t) => t.name === table.name
          );
          if (layoutedTable) {
            return {
              ...table,
              position: layoutedTable.position,
            };
          }
          // Keep hidden tables at their current positions
          return table;
        }),
      };

      // Animate to new positions
      startTableAnimation(updatedSchema);
    }

    prevSelectedCategoriesRef.current = new Set(selectedCategories);
  }, [
    selectedCategories,
    visibleTables,
    currentSchema,
    currentLayout,
    viewMode,
    applyLayout,
    startTableAnimation,
  ]);

  // Clear selections if selected table/relationship becomes invisible
  useEffect(() => {
    if (selectedTable && !visibleTableNames.has(selectedTable.name)) {
      setSelectedTable(null);
    }
    if (
      selectedRelationship &&
      (!visibleTableNames.has(selectedRelationship.fromTable) ||
        !visibleTableNames.has(selectedRelationship.toTable))
    ) {
      setSelectedRelationship(null);
    }
  }, [selectedTable, selectedRelationship, visibleTableNames]);

  const handleTableLongPress = useCallback(
    (table: Table) => {
      // Set flag to prevent click-away from firing immediately after long press
      setLongPressFlag();

      // Select the table and clear relationship selection
      setSelectedTable(table);
      setSelectedRelationship(null);

      // Re-center camera on the table (without rotating)
      const targetPoint = new THREE.Vector3(...table.position);
      const { position, lookAt } =
        calculateCameraPositionForRecenter(targetPoint);

      setRecenterTarget(position);
      setRecenterLookAt(lookAt);
      setRecenterTranslateOnly(true); // Long press should only translate
      setShouldRecenter(true);
    },
    [setLongPressFlag]
  );

  const handleRelationshipLongPress = useCallback(
    (relationship: Relationship) => {
      // Set flag to prevent click-away from firing immediately after long press
      setLongPressFlag();

      // Select the relationship and clear table selection
      setSelectedRelationship(relationship);
      setSelectedTable(null);

      // Find the two tables connected by this relationship
      const fromTable = currentSchema.tables.find(
        (t) => t.name === relationship.fromTable
      );
      const toTable = currentSchema.tables.find(
        (t) => t.name === relationship.toTable
      );

      if (fromTable && toTable) {
        const fromPos = new THREE.Vector3(...fromTable.position);
        const toPos = new THREE.Vector3(...toTable.position);
        // Calculate the midpoint between the two tables
        const centerPoint = new THREE.Vector3()
          .addVectors(fromPos, toPos)
          .multiplyScalar(0.5);

        // Re-center camera on the relationship midpoint (without rotating)
        const { position, lookAt } =
          calculateCameraPositionForRecenter(centerPoint);

        setRecenterTarget(position);
        setRecenterLookAt(lookAt);
        setShouldRecenter(true);
      }
    },
    [currentSchema, setLongPressFlag]
  );

  const isFiltering = useMemo(
    () => filteredTables.size > 0 || relatedTables.size > 0,
    [filteredTables.size, relatedTables.size]
  );

  // Calculate directly connected tables when a table or relationship is selected
  const connectedTables = useMemo(
    () =>
      getConnectedTables(currentSchema, selectedTable, selectedRelationship),
    [currentSchema, selectedTable, selectedRelationship]
  );

  // Calculate desired max camera distance based on schema extent
  const desiredMaxCameraDistance = useMemo(
    () => calculateMaxCameraDistance(currentSchema.tables),
    [currentSchema.tables]
  );

  // State for actual maxDistance (will be updated after animation)
  const [maxCameraDistance, setMaxCameraDistance] = useState(() =>
    calculateMaxCameraDistance(currentSchema.tables)
  );

  // Smoothly animate zoom when maxDistance needs to decrease
  const zoomCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const orbitControls = (
      window as { __orbitControls?: ComponentRef<typeof OrbitControls> }
    ).__orbitControls;
    if (!orbitControls) {
      setMaxCameraDistance(desiredMaxCameraDistance);
      return;
    }

    const currentDistance = orbitControls.object.position.distanceTo(
      orbitControls.target
    );

    // Only animate if desired maxDistance decreased and camera is beyond the new limit
    if (
      desiredMaxCameraDistance < maxCameraDistance &&
      currentDistance > desiredMaxCameraDistance
    ) {
      // Cancel any existing animation
      if (zoomCancelRef.current) {
        zoomCancelRef.current();
      }

      // Start new animation
      zoomCancelRef.current = animateCameraZoom(
        orbitControls,
        currentDistance,
        desiredMaxCameraDistance,
        800,
        () => {
          // Animation complete - now update maxDistance
          setMaxCameraDistance(desiredMaxCameraDistance);
          zoomCancelRef.current = null;
        }
      );
    } else {
      // No animation needed, update immediately
      setMaxCameraDistance(desiredMaxCameraDistance);
    }

    // Cleanup function to cancel animation if component unmounts or dependencies change
    return () => {
      if (zoomCancelRef.current) {
        zoomCancelRef.current();
        zoomCancelRef.current = null;
      }
    };
  }, [desiredMaxCameraDistance, maxCameraDistance]);

  return (
    <>
      <Helmet>
        <title>
          Schema3D: Interactive Database Schema Visualization Tool (SQL, T-SQL,
          & Mermaid)
        </title>
        <meta
          name="description"
          content="Visualize your database schemas in stunning 3D. Interactive schema visualizer tool supporting SQL/T-SQL & Mermaid Markdown. Explore database relationships, tables, and foreign keys with full cardinality notation. Perfect for database design and documentation."
        />
        <link rel="canonical" href="https://schema3d.com" />
      </Helmet>
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onClick={(e) => {
          // Don't close if we just did a long press (prevents interference)
          if (justLongPressedRef.current) {
            return;
          }

          if (shouldClosePanels(e.target as HTMLElement)) {
            setSelectedTable(null);
            setSelectedRelationship(null);
          }
        }}
      >
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            glCanvasRef.current = gl.domElement;
          }}
          onPointerMissed={() => {
            // Don't close if we just did a long press (prevents interference)
            if (justLongPressedRef.current) {
              return;
            }

            // Close details panels when clicking on empty space in 3D scene
            if (selectedTable || selectedRelationship) {
              setSelectedTable(null);
              setSelectedRelationship(null);
            }
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 8, 20]} fov={60} />
          <OrbitControls
            ref={(controls) => {
              if (controls) {
                (
                  window as {
                    __orbitControls?: ComponentRef<typeof OrbitControls>;
                  }
                ).__orbitControls = controls;
              }
            }}
            enableDamping
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={maxCameraDistance}
            enabled={!isCameraAnimating && !isDraggingTable}
          />

          <color attach="background" args={["#0f172a"]} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />

          <CameraController
            shouldRecenter={shouldRecenter}
            recenterTarget={recenterTarget}
            recenterLookAt={recenterLookAt}
            translateOnly={recenterTranslateOnly}
            onRecenterComplete={useCallback(() => {
              setShouldRecenter(false);
            }, [])}
            onAnimatingChange={setIsCameraAnimating}
          />

          <Suspense fallback={null}>
            <RelationshipLines
              schema={currentSchema}
              selectedRelationship={selectedRelationship}
              hoveredRelationship={hoveredRelationship}
              selectedTable={selectedTable}
              onSelect={handleRelationshipSelect}
              onHover={setHoveredRelationship}
              onLongPress={handleRelationshipLongPress}
              animatedPositions={
                isAnimatingRef.current ? animatedPositions : undefined
              }
              visibleTableNames={visibleTableNames}
            />

            {visibleTables.map((table) => {
              const isMatched = filteredTables.has(table.name);
              const isRelated = relatedTables.has(table.name);
              const hasSelection = !!(selectedTable || selectedRelationship);

              const isDimmed = shouldDimTable(
                table,
                filteredTables,
                relatedTables,
                connectedTables,
                hasSelection,
                isFiltering
              );

              const isRelationshipHighlighted =
                isTableInRelationship(table, selectedRelationship) ||
                isTableInRelationship(table, hoveredRelationship);

              return (
                <Table3D
                  key={table.name}
                  table={table}
                  isSelected={selectedTable?.name === table.name}
                  isHovered={hoveredTable?.name === table.name}
                  isHighlighted={isMatched}
                  isRelated={isRelated}
                  isDimmed={isDimmed}
                  isRelationshipHighlighted={isRelationshipHighlighted}
                  onSelect={handleTableSelect}
                  onHover={setHoveredTable}
                  onLongPress={handleTableLongPress}
                  onPositionChange={handleTablePositionChange}
                  onDragStart={() => setIsDraggingTable(true)}
                  onDragEnd={() => setIsDraggingTable(false)}
                  targetPosition={targetPositions.get(table.name)}
                  animationStartTime={animationStartTimeRef.current}
                  isAnimating={isAnimatingRef.current}
                  onAnimatedPositionChange={(
                    tableName: string,
                    position: [number, number, number]
                  ) => {
                    // Update ref immediately for useFrame access
                    animatedPositionsRef.current.set(tableName, position);

                    // Update state immediately to ensure RelationshipLines get updates
                    // Create a new Map to trigger React re-render
                    setAnimatedPositions(new Map(animatedPositionsRef.current));
                  }}
                />
              );
            })}

            {/* Circular concentric grid */}
            <polarGridHelper args={[40, 0, 8, 128, "#1e293b", "#1e293b"]} />
          </Suspense>
        </Canvas>

        <div className="absolute right-2 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 top-16 lg:top-2 z-10">
          <StatsDisplay />
        </div>

        <div className="absolute right-2 sm:top-4 sm:right-4 top-2 z-10">
          <Link to="/about">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm w-9 h-9 sm:w-10 sm:h-10"
              title="About Schema3D"
            >
              <Info size={18} className="sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </div>

        <div className="absolute top-2 right-[96px] sm:top-4 sm:right-16 sm:w-64">
          <SearchFilter tables={currentSchema.tables} onFilter={handleFilter} />
        </div>

        {/* Overview card at top-left */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
          <Card className="bg-slate-900/70 border-slate-700 text-white backdrop-blur-sm p-2 sm:p-4 min-w-[164px] sm:min-w-[200px] pb-2 sm:pb-3">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <h2 className="text-sm sm:text-lg font-bold truncate max-w-[150px] sm:max-w-none">
                {currentSchema.name + " Schema"}
              </h2>
              <SchemaSelector
                currentSchema={currentSchema}
                onSchemaChange={handleSchemaChangeFromSelector}
                persistedSchemaRef={persistedSchemaRef}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mb-0">
              {currentSchema.tables.filter((t) => !t.isView).length} tables
              {currentSchema.tables.filter((t) => t.isView).length > 0 && (
                <>
                  , {currentSchema.tables.filter((t) => t.isView).length} views
                </>
              )}
            </p>
          </Card>
        </div>

        <ViewControls
          schema={currentSchema}
          onSchemaChange={handleSchemaChange}
          currentLayout={currentLayout}
          onLayoutChange={handleLayoutChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
        />

        <div className="absolute top-2 right-[52px] bottom-auto left-auto sm:right-auto sm:bottom-safe-bottom-lg sm:left-1/2 sm:-translate-x-1/2 sm:top-auto z-10">
          <Button
            onClick={handleRecenter}
            variant="outline"
            size="icon"
            className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm w-9 h-9 sm:w-10 sm:h-10"
            title="Re-center camera"
          >
            <Compass size={18} className="sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="absolute bottom-safe-bottom right-2 sm:bottom-safe-bottom-lg sm:right-4">
          <ExportControls schema={currentSchema} canvasRef={glCanvasRef} />
        </div>

        {selectedTable && (
          <div ref={detailsPanelRef}>
            <TableInfo
              table={selectedTable}
              onClose={() => {
                setSelectedTable(null);
              }}
            />
          </div>
        )}

        {selectedRelationship && (
          <div ref={detailsPanelRef}>
            <RelationshipInfo
              relationship={selectedRelationship}
              onClose={() => {
                setSelectedRelationship(null);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
