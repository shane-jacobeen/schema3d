import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
  useMemo,
} from "react";
import * as THREE from "three";
import {
  calculateMaxCameraDistance,
  animateCameraZoom,
  getDefaultCameraPosition,
  getTopDownCameraPosition,
  getTopDownFitDistance,
  shouldRotateToTopDownFor2D,
} from "../utils/camera-utils";
import { getOrbitControls } from "../context/orbit-controls-context";
import type { Table } from "@/shared/types/schema";

interface UseCameraControlsReturn {
  shouldRecenter: boolean;
  recenterTarget: THREE.Vector3 | null;
  recenterLookAt: THREE.Vector3 | null;
  recenterTranslateOnly: boolean;
  recenterOrbitOnly: boolean;
  restrictPolarAngle: boolean;
  defaultCameraPosition: THREE.Vector3;
  isCameraAnimating: boolean;
  maxCameraDistance: number;
  setShouldRecenter: React.Dispatch<React.SetStateAction<boolean>>;
  setRecenterTarget: React.Dispatch<React.SetStateAction<THREE.Vector3 | null>>;
  setRecenterLookAt: React.Dispatch<React.SetStateAction<THREE.Vector3 | null>>;
  setRecenterTranslateOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setRecenterOrbitOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setRestrictPolarAngle: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCameraAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  handleRecenter: () => void;
  frameCameraForViewMode: (
    mode: "2D" | "3D",
    tables?: Array<{ position: [number, number, number] }>
  ) => void;
}

export function useCameraControls(tables: Table[]): UseCameraControlsReturn {
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const [recenterTarget, setRecenterTarget] = useState<THREE.Vector3 | null>(
    null
  );
  const [recenterLookAt, setRecenterLookAt] = useState<THREE.Vector3 | null>(
    null
  );
  const [recenterTranslateOnly, setRecenterTranslateOnly] = useState(false);
  const [recenterOrbitOnly, setRecenterOrbitOnly] = useState(false);
  const [restrictPolarAngle, setRestrictPolarAngle] = useState(false);
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);

  // Calculate desired max camera distance based on schema extent
  const desiredMaxCameraDistance = calculateMaxCameraDistance(tables);

  // State for actual maxDistance (will be updated after animation)
  const [maxCameraDistance, setMaxCameraDistance] = useState(() =>
    calculateMaxCameraDistance(tables)
  );

  // Calculate default camera position based on max distance
  // This reuses the same distance calculation for consistency
  const defaultCameraPosition = useMemo(
    () => getDefaultCameraPosition(desiredMaxCameraDistance),
    [desiredMaxCameraDistance]
  );

  // Smoothly animate zoom when maxDistance needs to decrease
  const zoomCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const orbitControls = getOrbitControls();
    if (!orbitControls) {
      startTransition(() => {
        setMaxCameraDistance(desiredMaxCameraDistance);
      });
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
          startTransition(() => {
            setMaxCameraDistance(desiredMaxCameraDistance);
          });
          zoomCancelRef.current = null;
        }
      );
    } else {
      // No animation needed, update immediately
      startTransition(() => {
        setMaxCameraDistance(desiredMaxCameraDistance);
      });
    }

    // Cleanup function to cancel animation if component unmounts or dependencies change
    return () => {
      if (zoomCancelRef.current) {
        zoomCancelRef.current();
        zoomCancelRef.current = null;
      }
    };
  }, [desiredMaxCameraDistance, maxCameraDistance]);

  const handleRecenter = useCallback(() => {
    setRecenterTarget(null);
    setRecenterLookAt(null);
    setRecenterTranslateOnly(false); // Recenter button should rotate
    setRecenterOrbitOnly(false);
    setShouldRecenter(true);
  }, []);

  const defaultCameraPositionRef = useRef(defaultCameraPosition);
  useEffect(() => {
    defaultCameraPositionRef.current = defaultCameraPosition;
  }, [defaultCameraPosition]);

  // 2D flattens tables onto y=0. Untilt when shallower than 45°, and zoom out
  // far enough that the flattened bounds fit in the FOV.
  const frameCameraForViewMode = useCallback(
    (
      mode: "2D" | "3D",
      tables: Array<{ position: [number, number, number] }> = []
    ) => {
      if (mode !== "2D") {
        setRestrictPolarAngle(false);
        return;
      }

      const orbitControls = getOrbitControls();
      const lookAt =
        orbitControls?.target.clone() ?? new THREE.Vector3(0, 0, 0);
      const from =
        orbitControls?.object.position.clone() ??
        defaultCameraPositionRef.current.clone();

      const untilt = shouldRotateToTopDownFor2D(from, lookAt);
      const fitDistance =
        tables.length > 0 ? getTopDownFitDistance(tables, lookAt) : 0;
      const needsZoom = from.distanceTo(lookAt) < fitDistance - 0.5;

      if (!untilt && !needsZoom) {
        setRestrictPolarAngle(true);
        return;
      }

      setRecenterTarget(
        getTopDownCameraPosition(from, lookAt, {
          fitDistance,
          untilt,
        })
      );
      setRecenterLookAt(lookAt);
      setRecenterTranslateOnly(false);
      setRecenterOrbitOnly(true);
      setRestrictPolarAngle(false);
      setIsCameraAnimating(true);
      setShouldRecenter(true);
    },
    []
  );

  return {
    shouldRecenter,
    recenterTarget,
    recenterLookAt,
    recenterTranslateOnly,
    recenterOrbitOnly,
    restrictPolarAngle,
    defaultCameraPosition,
    isCameraAnimating,
    maxCameraDistance,
    setShouldRecenter,
    setRecenterTarget,
    setRecenterLookAt,
    setRecenterTranslateOnly,
    setRecenterOrbitOnly,
    setRestrictPolarAngle,
    setIsCameraAnimating,
    handleRecenter,
    frameCameraForViewMode,
  };
}
