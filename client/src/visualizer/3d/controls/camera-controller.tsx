import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getOrbitControls } from "@/visualizer/3d/context/orbit-controls-context";
import {
  DOLLY_SECONDS,
  easeInOutCubic,
  longPressRepositionAlpha,
  type CameraMove,
} from "@/visualizer/3d/utils/camera-utils";

const POSITION_THRESHOLD = 0.1;
const ROTATION_THRESHOLD = 0.01;
const MOVE_SPEED = 0.05;
const ROTATION_SPEED = 1.5; // radians per second

interface CameraControllerProps {
  move?: CameraMove | null;
  onMoveComplete?: () => void;
}

export function CameraController({
  move = null,
  onMoveComplete,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const fromPosition = useRef(new THREE.Vector3());
  const fromLookAt = useRef(new THREE.Vector3());
  const elapsed = useRef(0);
  const motionRef = useRef<CameraMove["motion"] | null>(null);
  const isAnimating = useRef(false);
  const onMoveCompleteRef = useRef(onMoveComplete);

  useEffect(() => {
    onMoveCompleteRef.current = onMoveComplete;
  });

  useEffect(() => {
    if (!move) {
      isAnimating.current = false;
      motionRef.current = null;
      return;
    }

    targetPosition.current.copy(move.position);
    targetLookAt.current.copy(move.lookAt);
    motionRef.current = move.motion;
    if (move.motion === "pan" || move.motion === "dolly") {
      fromPosition.current.copy(camera.position);
      const orbitControls = getOrbitControls();
      fromLookAt.current.copy(orbitControls?.target ?? move.lookAt);
      elapsed.current = 0;
    }
    isAnimating.current = true;
  }, [move, camera]);

  const syncOrbitControls = () => {
    const orbitControls = getOrbitControls();
    if (!orbitControls) return;

    orbitControls.target.copy(targetLookAt.current);

    const offset = new THREE.Vector3().subVectors(
      camera.position,
      orbitControls.target
    );

    const controlsWithSpherical = orbitControls as typeof orbitControls & {
      spherical?: THREE.Spherical;
    };
    if (controlsWithSpherical.spherical) {
      controlsWithSpherical.spherical.setFromVector3(offset);
    }

    orbitControls.update();
  };

  const completeAnimation = () => {
    camera.position.copy(targetPosition.current);
    camera.lookAt(targetLookAt.current);
    syncOrbitControls();
    isAnimating.current = false;
    onMoveCompleteRef.current?.();
  };

  const stepOrbit = (delta: number) => {
    const lookAt = targetLookAt.current;
    const currentSpherical = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(camera.position, lookAt)
    );
    const targetSpherical = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(targetPosition.current, lookAt)
    );

    const phiDelta = targetSpherical.phi - currentSpherical.phi;
    const radiusDelta = targetSpherical.radius - currentSpherical.radius;
    if (
      Math.abs(phiDelta) <= ROTATION_THRESHOLD &&
      Math.abs(radiusDelta) <= POSITION_THRESHOLD
    ) {
      completeAnimation();
      return;
    }

    const phiStep =
      Math.sign(phiDelta) *
      Math.min(Math.abs(phiDelta), ROTATION_SPEED * delta);
    currentSpherical.phi += phiStep;
    currentSpherical.radius = THREE.MathUtils.lerp(
      currentSpherical.radius,
      targetSpherical.radius,
      MOVE_SPEED
    );
    currentSpherical.makeSafe();

    camera.position
      .copy(lookAt)
      .add(new THREE.Vector3().setFromSpherical(currentSpherical));
    camera.lookAt(lookAt);

    const orbitControls = getOrbitControls();
    if (orbitControls) {
      orbitControls.target.copy(lookAt);
    }
  };

  const stepPan = (delta: number) => {
    const orbitControls = getOrbitControls();
    const lookAtGap = orbitControls
      ? fromLookAt.current.distanceTo(targetLookAt.current)
      : 0;
    if (
      fromPosition.current.distanceTo(targetPosition.current) <=
        POSITION_THRESHOLD &&
      lookAtGap <= POSITION_THRESHOLD
    ) {
      completeAnimation();
      return;
    }

    elapsed.current += delta;
    const alpha = longPressRepositionAlpha(elapsed.current);
    camera.position.lerpVectors(
      fromPosition.current,
      targetPosition.current,
      alpha
    );

    if (orbitControls) {
      orbitControls.target.lerpVectors(
        fromLookAt.current,
        targetLookAt.current,
        alpha
      );
      orbitControls.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }

    if (alpha >= 1) {
      completeAnimation();
    }
  };

  const stepDolly = (delta: number) => {
    elapsed.current += delta;
    const alpha = easeInOutCubic(Math.min(elapsed.current / DOLLY_SECONDS, 1));
    camera.position.lerpVectors(
      fromPosition.current,
      targetPosition.current,
      alpha
    );

    const orbitControls = getOrbitControls();
    if (orbitControls) {
      orbitControls.target.copy(targetLookAt.current);
      orbitControls.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }

    if (alpha >= 1) {
      completeAnimation();
    }
  };

  const stepFrame = () => {
    const positionDistance = camera.position.distanceTo(targetPosition.current);

    if (positionDistance > POSITION_THRESHOLD) {
      camera.position.lerp(targetPosition.current, MOVE_SPEED);

      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(10).add(camera.position);
      currentLookAt.lerp(targetLookAt.current, MOVE_SPEED);
      camera.lookAt(currentLookAt);
      return;
    }

    completeAnimation();
  };

  useFrame((_, delta) => {
    if (!isAnimating.current || !motionRef.current) {
      return;
    }

    switch (motionRef.current) {
      case "orbit":
        stepOrbit(delta);
        return;
      case "pan":
        stepPan(delta);
        return;
      case "dolly":
        stepDolly(delta);
        return;
      case "frame":
        stepFrame();
        return;
    }
  });

  return null;
}
