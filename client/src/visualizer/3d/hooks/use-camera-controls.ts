import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import * as THREE from "three";
import {
  calculateMaxCameraDistance,
  getDefaultCameraPosition,
  getTopDownCameraPosition,
  getTopDownFitDistance,
  shouldRotateToTopDownFor2D,
  type CameraMove,
} from "../utils/camera-utils";
import { getOrbitControls } from "../context/orbit-controls-context";
import type { Table } from "@/shared/types/schema";

interface UseCameraControlsReturn {
  cameraMove: CameraMove | null;
  restrictPolarAngle: boolean;
  defaultCameraPosition: THREE.Vector3;
  isCameraAnimating: boolean;
  maxCameraDistance: number;
  requestCameraMove: (move: CameraMove | null) => void;
  completeCameraMove: () => void;
  setRestrictPolarAngle: React.Dispatch<React.SetStateAction<boolean>>;
  handleRecenter: () => void;
  frameCameraForViewMode: (
    mode: "2D" | "3D",
    tables?: Array<{ position: [number, number, number] }>
  ) => void;
}

export function useCameraControls(tables: Table[]): UseCameraControlsReturn {
  const [cameraMove, setCameraMove] = useState<CameraMove | null>(null);
  const [restrictPolarAngle, setRestrictPolarAngle] = useState(false);
  const cameraMoveRef = useRef<CameraMove | null>(null);
  const pendingMaxDistanceRef = useRef<number | null>(null);
  const framedDistanceRef = useRef<number | null>(null);

  const desiredMaxCameraDistance = calculateMaxCameraDistance(tables);
  const prevDesiredRef = useRef(desiredMaxCameraDistance);

  const [maxCameraDistance, setMaxCameraDistance] = useState(() =>
    calculateMaxCameraDistance(tables)
  );

  const defaultCameraPosition = useMemo(
    () => getDefaultCameraPosition(desiredMaxCameraDistance),
    [desiredMaxCameraDistance]
  );

  const requestCameraMove = useCallback((move: CameraMove | null) => {
    if (move && move.motion !== "dolly") {
      pendingMaxDistanceRef.current = null;
    }
    cameraMoveRef.current = move;
    setCameraMove(move);
  }, []);

  const completeCameraMove = useCallback(() => {
    const active = cameraMoveRef.current;
    if (active?.motion === "dolly" && pendingMaxDistanceRef.current != null) {
      setMaxCameraDistance(pendingMaxDistanceRef.current);
      pendingMaxDistanceRef.current = null;
    }
    requestCameraMove(null);
  }, [requestCameraMove]);

  useEffect(() => {
    const previousDesired = prevDesiredRef.current;
    prevDesiredRef.current = desiredMaxCameraDistance;

    const orbitControls = getOrbitControls();
    if (!orbitControls) {
      startTransition(() => {
        setMaxCameraDistance(desiredMaxCameraDistance);
      });
      return;
    }

    const active = cameraMoveRef.current;
    if (active && active.motion !== "dolly") {
      return;
    }

    const currentDistance = orbitControls.object.position.distanceTo(
      orbitControls.target
    );
    const desiredDecreased = desiredMaxCameraDistance < previousDesired - 0.5;
    const holdingFrame =
      framedDistanceRef.current != null &&
      currentDistance <= framedDistanceRef.current + 0.5;
    if (holdingFrame && desiredDecreased) {
      framedDistanceRef.current = null;
    }

    const needsDolly =
      desiredDecreased &&
      !holdingFrame &&
      currentDistance > desiredMaxCameraDistance + 0.5;

    if (!needsDolly) {
      if (active?.motion === "dolly") {
        return;
      }
      const nextMax = Math.max(desiredMaxCameraDistance, currentDistance);
      if (maxCameraDistance !== nextMax) {
        startTransition(() => {
          setMaxCameraDistance(nextMax);
        });
      }
      return;
    }

    if (
      active?.motion === "dolly" &&
      pendingMaxDistanceRef.current === desiredMaxCameraDistance
    ) {
      return;
    }

    const lookAt = orbitControls.target.clone();
    const offset = orbitControls.object.position.clone().sub(lookAt);
    if (offset.length() < 1e-6) {
      startTransition(() => {
        setMaxCameraDistance(desiredMaxCameraDistance);
      });
      return;
    }
    offset.setLength(desiredMaxCameraDistance);
    pendingMaxDistanceRef.current = desiredMaxCameraDistance;
    startTransition(() => {
      requestCameraMove({
        position: lookAt.clone().add(offset),
        lookAt,
        motion: "dolly",
      });
    });
  }, [
    desiredMaxCameraDistance,
    maxCameraDistance,
    cameraMove,
    requestCameraMove,
  ]);

  const defaultCameraPositionRef = useRef(defaultCameraPosition);
  useEffect(() => {
    defaultCameraPositionRef.current = defaultCameraPosition;
  }, [defaultCameraPosition]);

  const handleRecenter = useCallback(() => {
    requestCameraMove({
      position: defaultCameraPositionRef.current.clone(),
      lookAt: new THREE.Vector3(0, 0, 0),
      motion: "frame",
    });
  }, [requestCameraMove]);

  // 2D flattens tables onto y=0. Untilt when shallower than 45°, and zoom out
  // far enough that the flattened bounds fit in the FOV.
  const frameCameraForViewMode = useCallback(
    (
      mode: "2D" | "3D",
      tables: Array<{ position: [number, number, number] }> = []
    ) => {
      if (mode !== "2D") {
        framedDistanceRef.current = null;
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

      const position = getTopDownCameraPosition(from, lookAt, {
        fitDistance,
        untilt,
      });
      const framedDistance = position.distanceTo(lookAt);
      framedDistanceRef.current = framedDistance;
      setMaxCameraDistance((current) => Math.max(current, framedDistance));
      requestCameraMove({
        position,
        lookAt,
        motion: "orbit",
      });
      setRestrictPolarAngle(false);
    },
    [requestCameraMove]
  );

  return {
    cameraMove,
    restrictPolarAngle,
    defaultCameraPosition,
    isCameraAnimating: cameraMove !== null,
    maxCameraDistance,
    requestCameraMove,
    completeCameraMove,
    setRestrictPolarAngle,
    handleRecenter,
    frameCameraForViewMode,
  };
}
