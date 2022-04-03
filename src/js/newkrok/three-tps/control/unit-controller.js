import * as THREE from "three";

import { unitActionState } from "./unit-action-manager.js";

let _target = null;
let _world = null;

let isMovementBlocked = false;

export const setUnitControllerTarget = ({ target, world }) => {
  _target = target;
  _world = world;
};

export const updateUnitController = ({ now, delta }) => {
  if (_target) {
    const {
      viewRotation,
      userData: { useAim },
    } = _target;

    const cameraRotation = _world.tpsCamera.getRotation().clone();

    isMovementBlocked = false;

    const verticalVelocity =
      Math.max(unitActionState.backward.value, unitActionState.forward.value) *
      (unitActionState.backward.value > unitActionState.forward.value ? -1 : 1);

    const horizontalVelocity =
      Math.max(unitActionState.left.value, unitActionState.right.value) *
      (unitActionState.left.value > unitActionState.right.value ? 1 : -1);

    const baseSpeed = _target.onGround
      ? _target.config.speedOnGround
      : _target.config.speedInAir;

    const velocity =
      (unitActionState.run.pressed ? baseSpeed * 2.5 : baseSpeed) *
      Math.max(
        unitActionState.forward.value,
        unitActionState.backward.value,
        unitActionState.left.value,
        unitActionState.right.value
      );
    let velocityMultiplier = 1;

    if ((!isMovementBlocked && velocity !== 0) || useAim) {
      let targetRotation = useAim
        ? cameraRotation.x
        : cameraRotation.x +
          Math.PI / 2 +
          Math.PI +
          (velocity === 0 && useAim
            ? Math.PI / 2
            : Math.atan2(verticalVelocity, horizontalVelocity));
      let newViewRotation = viewRotation;
      if (newViewRotation < 0) newViewRotation += Math.PI * 2;
      let diff = targetRotation - newViewRotation;

      while (Math.abs(diff) > Math.PI) {
        if (targetRotation < newViewRotation) {
          if (targetRotation === 0) targetRotation = Math.PI * 2;
          else targetRotation += Math.PI * 2;

          if (targetRotation >= Math.PI * 4) {
            targetRotation -= Math.PI * 4;
            newViewRotation -= Math.PI * 4;
          }
        } else {
          newViewRotation += Math.PI * 2;
        }
        diff = targetRotation - newViewRotation;
      }
      _target.setRotation(_target.viewRotation + diff * (delta / 0.1));

      let normalizedDiff = Math.abs(diff);
      normalizedDiff -= normalizedDiff > Math.PI ? Math.PI : 0;

      velocityMultiplier =
        normalizedDiff > 0.9 ? 0 : (Math.PI - normalizedDiff) / Math.PI;

      let noramalizedTargetRotation = Math.PI * 2 - targetRotation;
      let relativeVector;

      _target.moveBack = unitActionState.backward.value > 0;

      if (useAim) {
        _target.isStrafing =
          unitActionState.left.pressed || unitActionState.right.pressed;
        if (_target.isStrafing)
          velocityMultiplier *= unitActionState.run.pressed ? 0.7 : 0.95;
        let rotationOffset = 0;

        if (unitActionState.left.value)
          rotationOffset =
            unitActionState.forward.value > 0
              ? Math.PI / 4
              : unitActionState.backward.value > 0
              ? Math.PI + -Math.PI / 4
              : Math.PI / 2;
        else if (unitActionState.right.value)
          rotationOffset =
            unitActionState.forward.value > 0
              ? -Math.PI / 4
              : unitActionState.backward.value > 0
              ? Math.PI + Math.PI / 4
              : -Math.PI / 2;
        else if (unitActionState.backward.value) rotationOffset = Math.PI;

        _target.strafingDirection = unitActionState.left.value
          ? 1
          : unitActionState.right.value
          ? -1
          : 0;
        relativeVector = new THREE.Vector3(
          Math.sin(noramalizedTargetRotation + rotationOffset) *
            velocity *
            velocityMultiplier *
            delta,
          0,
          Math.cos(noramalizedTargetRotation + rotationOffset) *
            velocity *
            velocityMultiplier *
            delta
        );
      } else {
        _target.isStrafing = false;
        relativeVector = new THREE.Vector3(
          Math.sin(noramalizedTargetRotation) *
            velocity *
            velocityMultiplier *
            delta,
          0,
          Math.cos(noramalizedTargetRotation) *
            velocity *
            velocityMultiplier *
            delta
        );
      }
      if (!isMovementBlocked) {
        if (
          unitActionState.forward.pressed ||
          unitActionState.backward.pressed ||
          unitActionState.left.pressed ||
          unitActionState.right.pressed
        )
          _target.addVelocity(relativeVector);
      }
    }

    _target.turn = 0;
  }
};
