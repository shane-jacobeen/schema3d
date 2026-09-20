import { createContext, useContext } from "react";
import type { useVisualizerState } from "../hooks/use-visualizer-state";

export type VisualizerState = ReturnType<typeof useVisualizerState>;

const VisualizerStateContext = createContext<VisualizerState | null>(null);

export function VisualizerStateProvider({
  value,
  children,
}: {
  value: VisualizerState;
  children: React.ReactNode;
}) {
  return (
    <VisualizerStateContext.Provider value={value}>
      {children}
    </VisualizerStateContext.Provider>
  );
}

export function useVisualizerStateContext(): VisualizerState {
  const context = useContext(VisualizerStateContext);
  if (!context) {
    throw new Error(
      "useVisualizerStateContext must be used within VisualizerStateProvider"
    );
  }
  return context;
}
