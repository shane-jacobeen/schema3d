import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
  type ComponentRef,
} from "react";
import { OrbitControls } from "@react-three/drei";
import {
  calculateMaxCameraDistance,
  animateCameraZoom,
} from "../utils/camera-utils";
import type { Table } from "@/shared/types/schema";

interface UseCameraControlsReturn {
  shouldRecenter: boolean;
  recenterTarget: THREE.Vector3 | null;
  recenterLookAt: THREE.Vector3 | null;
  recenterTranslateOnly: boolean;
  isCameraAnimating: boolean;
  maxCameraDistance: number;
  setShouldRecenter: React.Dispatch<React.SetStateAction<boolean>>;
  setRecenterTarget: React.Dispatch<React.SetStateAction<THREE.Vector3 | null>>;
  setRecenterLookAt: React.Dispatch<React.SetStateAction<THREE.Vector3 | null>>;
  setRecenterTranslateOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCameraAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  handleRecenter: () => void;
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
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);

  // Calculate desired max camera distance based on schema extent
  const desiredMaxCameraDistance = calculateMaxCameraDistance(tables);

  // State for actual maxDistance (will be updated after animation)
  const [maxCameraDistance, setMaxCameraDistance] = useState(() =>
    calculateMaxCameraDistance(tables)
  );

  // Smoothly animate zoom when maxDistance needs to decrease
  const zoomCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const orbitControls = (
      window as { __orbitControls?: ComponentRef<typeof OrbitControls> }
    ).__orbitControls;
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
    setShouldRecenter(true);
  }, []);

  return {
    shouldRecenter,
    recenterTarget,
    recenterLookAt,
    recenterTranslateOnly,
    isCameraAnimating,
    maxCameraDistance,
    setShouldRecenter,
    setRecenterTarget,
    setRecenterLookAt,
    setRecenterTranslateOnly,
    setIsCameraAnimating,
    handleRecenter,
  };
}
