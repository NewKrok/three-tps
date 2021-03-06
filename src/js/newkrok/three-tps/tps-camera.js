import * as THREE from "three";

import { Sphere } from "three";

export const createTPSCamera = (config) => {
  let target, q;
  let maxDistance, maxDistanceByCollision, currentDistance, maxCameraOffset;
  let _worldOctree;
  let useTargetRotation = false;
  let targetRotation = 0;

  let cameraSphere = new Sphere(
    new THREE.Vector3(),
    config.cameraCollisionRadius
  );

  maxDistance = maxDistanceByCollision = currentDistance = config.maxDistance;

  const requestedPositionOffset = new THREE.Vector3(
    config.positionOffset.x,
    config.positionOffset.y,
    config.positionOffset.z
  );
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const rotation = new THREE.Vector3();
  const rotationEuler = new THREE.Euler();
  const realTargetPosition = new THREE.Object3D();
  const rotatedPositionOffset = new THREE.Vector3(0, 0, 0);
  const targetAndOffsetNormalizedVector = new THREE.Vector3(0, 0, 0);
  const offsetAndCameraNormalizedVector = new THREE.Vector3(0, 0, 0);

  const calculateOffset = (pos) => {
    const normalizedDistance = Math.min(
      currentDistance,
      maxDistanceByCollision
    );
    const idealOffset = new THREE.Vector3(
      0,
      -normalizedDistance * Math.cos(rotation.y),
      -normalizedDistance * Math.sin(rotation.y)
    );
    idealOffset.applyQuaternion(q);
    idealOffset.add(pos);

    return idealOffset;
  };

  const normalizePositionOffset = () => {
    const reversedRotation = Math.PI - rotation.x + target.rotation.x;
    const rotatedRotation = reversedRotation + Math.PI / 2;
    rotatedPositionOffset.set(
      requestedPositionOffset.x * Math.sin(rotatedRotation) +
        requestedPositionOffset.z * Math.sin(reversedRotation),
      0,
      requestedPositionOffset.z * Math.cos(reversedRotation) +
        requestedPositionOffset.x * Math.cos(rotatedRotation)
    );
    targetAndOffsetNormalizedVector
      .copy(rotatedPositionOffset)
      .setLength(config.cameraCollisionRadius);
    maxCameraOffset = rotatedPositionOffset.length();
  };

  const setYBoundaries = ({ min, max }) => {
    config.yBoundaries.min = min || config.yBoundaries.min;
    config.yBoundaries.max = max || config.yBoundaries.max;
    rotation.y = Math.max(config.yBoundaries.min, rotation.y);
    rotation.y = Math.min(config.yBoundaries.max, rotation.y);
  };

  const setPositionOffset = (value) => {
    requestedPositionOffset.copy(value);
    normalizePositionOffset();
  };

  const normalizeRotation = (x) => {
    rotation.y = Math.max(config.yBoundaries.min, rotation.y);
    rotation.y = Math.min(config.yBoundaries.max, rotation.y);
    if (x !== null) q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -rotation.x);

    normalizePositionOffset();
  };

  return {
    instance: camera,
    init: ({ worldOctree }) => (_worldOctree = worldOctree),
    setTarget: (object) => {
      target = object;
      q = target.quaternion.clone();
      rotation.x = targetRotation =
        -rotationEuler.setFromQuaternion(q).y + config.initialRotation.x;
      rotation.y = config.initialRotation.y;
    },
    setMaxDistance: (value) => (maxDistance = value),
    setYBoundaries,
    setPositionOffset,
    update: ({ isPaused, delta }) => {
      if (config.stopDuringPause && isPaused) return;

      if (target) {
        if (useTargetRotation) {
          q.slerp(target.quaternion, config.lerp.targetRotation * delta);
          rotation.x = -rotationEuler.setFromQuaternion(q).y;
          normalizeRotation(null);
        }

        const targetPos = target.position.clone();

        if (targetPos) {
          const cameraCollisionStep = config.cameraCollisionRadius;
          targetPos.y += requestedPositionOffset.y;

          /**
           * Check collision between target and requested offset to calculate the max possible offset
           * */
          let hasCollision = false;
          let targetAndOffsetDistance = 0;
          cameraSphere.center.copy(targetPos);
          let sphereCollision = _worldOctree.sphereIntersect(cameraSphere);
          let isFirstCheckCollide = sphereCollision;
          while (
            targetAndOffsetDistance < maxCameraOffset &&
            !sphereCollision
          ) {
            targetAndOffsetDistance += cameraCollisionStep;
            if (isFirstCheckCollide) {
              cameraSphere.center.sub(targetAndOffsetNormalizedVector);
            } else {
              cameraSphere.center.add(targetAndOffsetNormalizedVector);
            }

            sphereCollision = _worldOctree.sphereIntersect(cameraSphere);
            hasCollision = hasCollision || sphereCollision;
          }
          if (sphereCollision) {
            cameraSphere.center.add(
              sphereCollision.normal.multiplyScalar(sphereCollision.depth)
            );
            targetAndOffsetDistance = targetPos.distanceTo(cameraSphere.center);
          }
          realTargetPosition.position.lerp(
            cameraSphere.center,
            delta *
              (hasCollision
                ? config.lerp.position.collision
                : config.lerp.position.normal)
          );
          cameraSphere.center.copy(realTargetPosition.position);

          /**
           * Check collision between offset target position and requested camera position
           * to calculate the max camera distance
           * */
          realTargetPosition.lookAt(
            calculateOffset(cameraSphere.center.clone())
          );
          offsetAndCameraNormalizedVector.set(0, 0, 1);
          offsetAndCameraNormalizedVector.applyQuaternion(
            realTargetPosition.quaternion
          );
          offsetAndCameraNormalizedVector.setLength(cameraCollisionStep);
          let offsetAndCameraDistance = cameraCollisionStep;
          sphereCollision = false;
          while (offsetAndCameraDistance < maxDistance && !sphereCollision) {
            offsetAndCameraDistance += cameraCollisionStep;
            cameraSphere.center.add(offsetAndCameraNormalizedVector);
            sphereCollision = _worldOctree.sphereIntersect(cameraSphere);
            hasCollision = hasCollision || sphereCollision;
          }
          if (sphereCollision) {
            cameraSphere.center.add(
              sphereCollision.normal.multiplyScalar(sphereCollision.depth)
            );
            offsetAndCameraDistance = realTargetPosition.position.distanceTo(
              cameraSphere.center
            );
          }

          currentDistance = THREE.MathUtils.lerp(
            currentDistance,
            offsetAndCameraDistance,
            delta *
              (hasCollision
                ? config.lerp.distance.collision
                : config.lerp.distance.normal)
          );

          maxDistanceByCollision = Math.max(
            hasCollision ? offsetAndCameraDistance : currentDistance,
            maxDistance
          );

          offsetAndCameraNormalizedVector.setLength(currentDistance);
          cameraSphere.center
            .copy(realTargetPosition.position)
            .add(offsetAndCameraNormalizedVector);
          camera.position.copy(cameraSphere.center);
          camera.lookAt(realTargetPosition.position);
        }
      }
    },
    getRotation: () => rotation,
    rotate: ({ x, y }) => {
      if (target) {
        if (!useTargetRotation) rotation.x += x ?? 0;
        rotation.y += y ?? 0;
        normalizeRotation(x);
      }
    },
    setRotation: ({ x, y }) => {
      if (target) {
        if (!useTargetRotation) rotation.x = x ?? 0;
        rotation.y = y ?? 0;
        normalizeRotation(x);
      }
    },
    getUseTargetRotation: () => useTargetRotation,
    setUseTargetRotation: (value) => (useTargetRotation = value),
  };
};
