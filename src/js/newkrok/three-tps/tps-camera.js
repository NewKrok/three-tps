import * as THREE from "three";

import { Sphere } from "three";

export const createTPSCamera = () => {
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const rotation = new THREE.Vector3();

  let _worldOctree;
  let cameraSphere = new Sphere(new THREE.Vector3(), 0.2);

  let target, q, distance, maxDistance, currentDistance;
  let minY = 1.2;
  let maxY = 2.7;
  let isAimZoomEnabled = false;
  let positionOffsetTarget = new THREE.Vector3(0, 0, 0);
  let positionOffset = new THREE.Vector3(0, 0, 0);
  let normalizedPositionOffset = new THREE.Vector3(0, 0, 0);

  const calculateOffset = () => {
    const normalizedDistance = Math.min(currentDistance, maxDistance);
    const idealOffset = new THREE.Vector3(
      0,
      1 + -normalizedDistance * Math.cos(rotation.y),
      -normalizedDistance * Math.sin(rotation.y)
    );
    const pos = target.position.clone();
    pos.add(normalizedPositionOffset);
    idealOffset.applyQuaternion(q);
    idealOffset.add(pos);
    return idealOffset;
  };

  const calculateLookat = () => {
    const idealLookat = new THREE.Vector3(0, 1, 0);
    const pos = target.position.clone();
    pos.add(normalizedPositionOffset);
    idealLookat.add(pos);
    return idealLookat;
  };

  const normalizePositionOffset = () => {
    normalizedPositionOffset.set(
      positionOffset.x + positionOffset.z * Math.cos(rotation.x),
      positionOffset.y,
      positionOffset.z * Math.sin(rotation.x)
    );
  };

  const setYBoundaries = ({ min, max }) => {
    minY = min || minY;
    maxY = max || maxY;
    rotation.y = Math.max(minY, rotation.y);
    rotation.y = Math.min(maxY, rotation.y);
  };

  const setPositionOffset = (value, useLerp = true) => {
    if (useLerp) positionOffsetTarget.copy(value);
    else positionOffset = value;
    normalizePositionOffset();
  };

  return {
    instance: camera,
    init: ({ worldOctree }) => (_worldOctree = worldOctree),
    setTarget: (object) => {
      target = object;
      q = target.quaternion.clone();
      rotation.x = -new THREE.Euler().setFromQuaternion(q).y;
      rotation.y = 2.4;
      distance = 15;
      currentDistance = distance;
      maxDistance = 99;
      normalizePositionOffset();
    },
    update: () => {
      if (target) {
        const targetPos = target.position.clone();
        if (targetPos) {
          if (
            Math.abs(positionOffset.distanceTo(positionOffsetTarget)) > 0.01
          ) {
            positionOffset.lerp(positionOffsetTarget, 0.1);
            normalizePositionOffset();
          }

          targetPos.y += 1;
          const vector = new THREE.Vector3(0, 0, 1);
          vector.applyQuaternion(camera.quaternion);

          const cameraCollisionStep = 0.1;
          let distance = cameraCollisionStep;
          vector.setLength(cameraCollisionStep);
          const maxDistance = isAimZoomEnabled ? 2 : 3;
          cameraSphere.center.copy(targetPos);
          while (
            distance < maxDistance &&
            !_worldOctree.sphereIntersect(cameraSphere)
          ) {
            distance += cameraCollisionStep;
            cameraSphere.center.add(vector);
          }
          distance -= cameraCollisionStep;
          currentDistance = THREE.Math.lerp(
            currentDistance,
            distance,
            distance < currentDistance ? 0.3 : 0.05
          );
          camera.position.copy(calculateOffset());
          camera.lookAt(calculateLookat());
        }
      }
    },
    getRotation: () => rotation,
    updateRotation: ({ x, y }) => {
      if (target) {
        rotation.x += x || 0;
        rotation.y += y || 0;
        rotation.y = Math.max(minY, rotation.y);
        rotation.y = Math.min(maxY, rotation.y);
        if (x) {
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -rotation.x);
        }
        normalizePositionOffset();
      }
    },
    useAimZoom: () => {
      isAimZoomEnabled = true;
      setPositionOffset(new THREE.Vector3(0, 0.6, -0.8));
      setYBoundaries({ min: 1, max: 2.6 });
    },

    disableAimZoom: () => {
      isAimZoomEnabled = false;
      setPositionOffset(new THREE.Vector3(0, 0, 0));
      setYBoundaries({ max: 2.7 });
    },
  };
};
