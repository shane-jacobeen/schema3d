import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";
import type { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import type { ComponentRef } from "react";

export type OrbitControlsRef = ComponentRef<typeof DreiOrbitControls> | null;

/**
 * Shared ref for OrbitControls, set inside the Canvas and read from hooks/components.
 */
export const orbitControlsRefHolder: { current: OrbitControlsRef } = {
  current: null,
};

const OrbitControlsContext =
  createContext<MutableRefObject<OrbitControlsRef> | null>(null);

export function OrbitControlsProvider({
  controlsRef,
  children,
}: {
  controlsRef: MutableRefObject<OrbitControlsRef>;
  children: React.ReactNode;
}) {
  return (
    <OrbitControlsContext.Provider value={controlsRef}>
      {children}
    </OrbitControlsContext.Provider>
  );
}

export function useOrbitControlsRef(): MutableRefObject<OrbitControlsRef> {
  const contextRef = useContext(OrbitControlsContext);
  if (contextRef) {
    return contextRef;
  }
  return orbitControlsRefHolder;
}

export function getOrbitControls(): OrbitControlsRef {
  return orbitControlsRefHolder.current;
}

export function setOrbitControls(controls: OrbitControlsRef): void {
  orbitControlsRefHolder.current = controls;
}
