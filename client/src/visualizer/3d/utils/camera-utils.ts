import * as THREE from "three";
import { getOrbitControls } from "@/visualizer/3d/context/orbit-controls-context";

/**
 * Vertical field of view of the scene camera, in degrees.
 */
export const CAMERA_FOV_DEGREES = 60;

/**
 * Minimum elevation above the graph plane for a readable 2D view, in radians.
 * Shallower than this (including looking from below) triggers a rotation
 * to a point directly above the current look-at.
 */
export const MIN_ELEVATION_2D = Math.PI / 4;

/**
 * Maximum orbit polar angle allowed in 2D mode, measured from +Y.
 * Equal to 45° elevation so 2D cannot return to an edge-on view after untilt.
 * Applied only after the camera is already within this range, to avoid a snap.
 */
export const MAX_POLAR_ANGLE_2D = Math.PI / 2 - MIN_ELEVATION_2D;

/**
 * Polar angle used for a 2D top-down view, in radians from +Y.
 * Small enough to read a flattened layout, large enough to avoid
 * OrbitControls gimbal lock at exact vertical.
 */
export const TOP_DOWN_POLAR_ANGLE = 0.25;

/**
 * Elevation of the camera above the look-at's XZ plane, in radians.
 * Positive is above the graph, zero is edge-on, negative is from below.
 */
export function getCameraElevationRadians(
  currentPosition: THREE.Vector3,
  lookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): number {
  const offset = currentPosition.clone().sub(lookAt);
  const distance = offset.length();
  if (distance < 1e-6) {
    return Math.PI / 2;
  }
  return Math.asin(THREE.MathUtils.clamp(offset.y / distance, -1, 1));
}

/**
 * True when a 2D toggle should rotate the camera above the graph:
 * the current view is shallower than 45° elevation, including from below.
 */
export function shouldRotateToTopDownFor2D(
  currentPosition: THREE.Vector3,
  lookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): boolean {
  return (
    getCameraElevationRadians(currentPosition, lookAt) < MIN_ELEVATION_2D - 1e-6
  );
}

export function calculateCameraPositionForRecenter(
  targetPoint: THREE.Vector3
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const orbitControls = getOrbitControls();
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
 * Calculate default camera position based on max camera distance
 * @param maxDistance - Maximum camera distance (from calculateMaxCameraDistance)
 * @returns Default camera position for schema viewing
 */
export function getDefaultCameraPosition(maxDistance: number): THREE.Vector3 {
  // Use 50% of max distance for a good initial view
  // Maintain the default viewing angle (similar to original 0, 8, 20)
  const distance = Math.max(20, maxDistance * 0.5);
  return new THREE.Vector3(0, distance * 0.4, distance);
}

/**
 * Point directly above the current look-at on the same orbit.
 * Preserves distance and azimuth; only the polar angle changes.
 */
export function getTopDownCameraPosition(
  currentPosition: THREE.Vector3,
  lookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.Vector3 {
  const offset = currentPosition.clone().sub(lookAt);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.radius = Math.max(spherical.radius, 20);
  spherical.phi = TOP_DOWN_POLAR_ANGLE;
  spherical.makeSafe();
  return lookAt.clone().add(new THREE.Vector3().setFromSpherical(spherical));
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

  // Set maxDistance to 2x the furthest distance, with minimum of 50 and maximum of 400
  // This allows zooming out enough to see the entire schema plus some extra space
  return Math.max(50, Math.min(400, maxDistance * 2));
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
