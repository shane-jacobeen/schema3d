import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";
import type { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import type { ComponentRef } from "react";

export type OrbitControlsRef = ComponentRef<typeof DreiOrbitControls> | null;

/**
 * Shared ref for OrbitControls. Written inside the Canvas; read from hooks
 * and camera utilities that sit outside the React tree.
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

/** Prefer context inside Canvas; fall back to the module holder outside it. */
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
