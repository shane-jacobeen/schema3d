import * as THREE from "three";
/**
 * Calculates camera position to center on target without rotating
 * This maintains the current camera orientation and only translates to center the target
 */
export function calculateCameraPositionForRecenter(
  targetPoint: THREE.Vector3
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  // Get current camera state from OrbitControls
  const orbitControls = (
    window as {
      __orbitControls?: {
        getAzimuthalAngle: () => number;
        getPolarAngle: () => number;
        target: THREE.Vector3;
        object: THREE.Camera;
      };
    }
  ).__orbitControls;
  if (!orbitControls) {
    // Fallback: use default position
    return {
      position: new THREE.Vector3(0, 8, 20),
      lookAt: targetPoint,
    };
  }

  // Get current camera position and direction
  const currentPosition = orbitControls.object.position.clone();
  const currentDirection = new THREE.Vector3();
  orbitControls.object.getWorldDirection(currentDirection);

  // Calculate distance from current camera to target
  const distanceToTarget = currentPosition.distanceTo(targetPoint);

  // Use a reasonable distance for centering (maintain current distance if reasonable)
  const desiredDistance = Math.max(15, Math.min(25, distanceToTarget));

  // Calculate new camera position: position camera so target is centered
  // by moving back along the current view direction
  const newPosition = new THREE.Vector3()
    .copy(targetPoint)
    .sub(currentDirection.multiplyScalar(desiredDistance));

  // Look at the target (but camera will maintain its orientation via OrbitControls)
  return {
    position: newPosition,
    lookAt: targetPoint,
  };
}

/**
 * Easing function for smooth animations (ease-in-out cubic)
 */
export function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

/**
 * Calculate max camera distance based on schema extent
 * @param tables - Array of tables with positions
 * @returns Max camera distance (clamped between 50 and 200)
 */
export function calculateMaxCameraDistance(
  tables: Array<{ position: [number, number, number] }>
): number {
  if (tables.length === 0) {
    return 70; // Default fallback
  }

  // Use the centerpoint of the visualization (origin)
  const center = new THREE.Vector3(0, 0, 0);

  // Find the table furthest from the visualization center
  let maxDistance = 0;
  tables.forEach((table) => {
    const tablePos = new THREE.Vector3(...table.position);
    const distance = center.distanceTo(tablePos);
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  });

  // Set maxDistance to 2x the furthest distance, with minimum of 50 and maximum of 200
  // This allows zooming out enough to see the entire schema plus some extra space
  return Math.max(50, Math.min(200, maxDistance * 2));
}

/**
 * Smoothly animate camera zoom to a target distance
 * @param orbitControls - The OrbitControls instance
 * @param startDistance - Starting zoom distance
 * @param targetDistance - Target zoom distance
 * @param duration - Animation duration in milliseconds
 * @param onComplete - Callback when animation completes
 * @returns Function to cancel the animation
 */
export function animateCameraZoom(
  orbitControls: {
    object: THREE.Camera;
    target: THREE.Vector3;
    spherical?: { setFromVector3: (v: THREE.Vector3) => void };
    update: () => void;
  } | null,
  startDistance: number,
  targetDistance: number,
  duration: number = 800,
  onComplete?: () => void
): () => void {
  let isAnimating = true;
  const startTime = Date.now();

  const animate = () => {
    if (!isAnimating || !orbitControls) {
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-in-out cubic
    const easedProgress = easeInOutCubic(progress);

    const interpolatedDistance = THREE.MathUtils.lerp(
      startDistance,
      targetDistance,
      easedProgress
    );

    // Get current direction to maintain orientation
    const direction = new THREE.Vector3()
      .subVectors(orbitControls.object.position, orbitControls.target)
      .normalize();

    // Calculate new position
    const newPosition = new THREE.Vector3()
      .copy(orbitControls.target)
      .add(direction.multiplyScalar(interpolatedDistance));

    // Update camera position
    orbitControls.object.position.copy(newPosition);

    // Update spherical coordinates to match
    if (orbitControls.spherical) {
      const offset = new THREE.Vector3().subVectors(
        orbitControls.object.position,
        orbitControls.target
      );
      orbitControls.spherical.setFromVector3(offset);
    }
    orbitControls.update();

    if (progress >= 1) {
      // Animation complete
      isAnimating = false;
      onComplete?.();
    } else {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    isAnimating = false;
  };
}
