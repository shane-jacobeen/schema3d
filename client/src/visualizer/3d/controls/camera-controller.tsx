import { useRef, useEffect, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Constants
const POSITION_THRESHOLD = 0.1;
const ROTATION_THRESHOLD = 0.01;
const MOVE_SPEED = 0.05;
const ROTATION_SPEED = 1.5; // radians per second
const FALLBACK_POSITION = new THREE.Vector3(0, 8, 20);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

interface CameraControllerProps {
  shouldRecenter?: boolean;
  recenterTarget?: THREE.Vector3 | null;
  recenterLookAt?: THREE.Vector3 | null;
  defaultPosition?: THREE.Vector3; // Calculated default position based on schema
  translateOnly?: boolean; // If true, only translate camera, don't rotate
  onRecenterComplete?: () => void;
  onAnimatingChange?: (isAnimating: boolean) => void;
}

export function CameraController({
  shouldRecenter = false,
  recenterTarget = null,
  recenterLookAt = null,
  defaultPosition,
  translateOnly = false,
  onRecenterComplete,
  onAnimatingChange,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 8, 20));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);

  useEffect(() => {
    if (shouldRecenter) {
      if (recenterTarget) {
        targetPosition.current.copy(recenterTarget);
        targetLookAt.current.copy(recenterLookAt || recenterTarget);
      } else {
        // Use calculated default position or fallback
        targetPosition.current.copy(defaultPosition || FALLBACK_POSITION);
        targetLookAt.current.copy(DEFAULT_LOOK_AT);
      }
      isAnimating.current = true;
      onAnimatingChange?.(true);
    } else {
      isAnimating.current = false;
      onAnimatingChange?.(false);
    }
  }, [
    shouldRecenter,
    recenterTarget,
    recenterLookAt,
    defaultPosition,
    onAnimatingChange,
  ]);

  // Helper function to sync OrbitControls with camera position
  const syncOrbitControls = () => {
    const orbitControls = (
      window as { __orbitControls?: ComponentRef<typeof DreiOrbitControls> }
    ).__orbitControls;
    if (!orbitControls) return;

    // Update OrbitControls target to match lookAt
    orbitControls.target.copy(targetLookAt.current);

    // Calculate offset from camera to target
    const offset = new THREE.Vector3().subVectors(
      camera.position,
      orbitControls.target
    );

    // Update spherical coordinates to match current camera position
    // Note: spherical is an internal property of OrbitControls, so we use type assertion
    const controlsWithSpherical = orbitControls as typeof orbitControls & {
      spherical?: THREE.Spherical;
    };
    if (controlsWithSpherical.spherical) {
      controlsWithSpherical.spherical.setFromVector3(offset);
    }

    // Force update to apply changes
    orbitControls.update();
  };

  // Helper function to complete animation
  const completeAnimation = () => {
    camera.position.copy(targetPosition.current);
    camera.lookAt(targetLookAt.current);

    // Sync OrbitControls to prevent it from resetting the camera
    syncOrbitControls();

    isAnimating.current = false;
    onAnimatingChange?.(false);
    onRecenterComplete?.();
  };

  useFrame((state, delta) => {
    // Only animate when recentering
    if (!isAnimating.current) {
      return;
    }

    const isMovingToTarget = recenterTarget !== null;

    if (isMovingToTarget) {
      const positionDistance = camera.position.distanceTo(
        targetPosition.current
      );

      // Move camera position smoothly
      if (positionDistance > POSITION_THRESHOLD) {
        camera.position.lerp(targetPosition.current, MOVE_SPEED);
      } else {
        camera.position.copy(targetPosition.current);
      }

      if (translateOnly) {
        // Only translate, don't rotate - just update OrbitControls target
        const orbitControls = (
          window as { __orbitControls?: ComponentRef<typeof DreiOrbitControls> }
        ).__orbitControls;
        if (orbitControls) {
          orbitControls.target.lerp(targetLookAt.current, MOVE_SPEED);
          orbitControls.update();
        }

        // Check if we're done
        const finalPositionDistance = camera.position.distanceTo(
          targetPosition.current
        );
        const targetDistance =
          orbitControls?.target.distanceTo(targetLookAt.current) || 0;
        if (
          finalPositionDistance <= POSITION_THRESHOLD &&
          targetDistance <= POSITION_THRESHOLD
        ) {
          completeAnimation();
        }
      } else {
        // Rotate camera to look at target
        const currentDirection = new THREE.Vector3();
        camera.getWorldDirection(currentDirection);

        const targetDirection = new THREE.Vector3()
          .subVectors(targetLookAt.current, camera.position)
          .normalize();

        const angle = currentDirection.angleTo(targetDirection);

        if (angle > ROTATION_THRESHOLD) {
          const maxRotation = ROTATION_SPEED * delta;
          const rotationAmount = Math.min(angle, maxRotation);

          const rotationAxis = new THREE.Vector3()
            .crossVectors(currentDirection, targetDirection)
            .normalize();

          if (rotationAxis.length() < 0.001) {
            rotationAxis.set(0, 1, 0);
          }

          const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
            rotationAxis,
            rotationAmount
          );

          const newDirection = currentDirection
            .applyQuaternion(rotationQuaternion)
            .normalize();

          const newLookAt = new THREE.Vector3()
            .copy(camera.position)
            .add(newDirection.multiplyScalar(10));

          camera.lookAt(newLookAt);
        } else {
          camera.lookAt(targetLookAt.current);

          const finalPositionDistance = camera.position.distanceTo(
            targetPosition.current
          );
          if (finalPositionDistance <= POSITION_THRESHOLD) {
            completeAnimation();
          }
        }
      }
    } else {
      // Move camera to default position (recenter button)
      const positionDistance = camera.position.distanceTo(
        targetPosition.current
      );

      if (positionDistance > POSITION_THRESHOLD) {
        camera.position.lerp(targetPosition.current, MOVE_SPEED);

        const currentLookAt = new THREE.Vector3();
        camera.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(10).add(camera.position);
        currentLookAt.lerp(targetLookAt.current, MOVE_SPEED);
        camera.lookAt(currentLookAt);
      } else {
        completeAnimation();
      }
    }
  });

  return null;
}
