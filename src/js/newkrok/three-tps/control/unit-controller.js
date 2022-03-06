import * as THREE from "three";

import {
  UnitAction,
  onUnitAction,
  unitActionState,
} from "./unit-action-manager.js";

import { ModelSocketId } from "@newkrok/three-game/src/js/newkrok/three-game/unit/unit-enums.js";

//import { EffectId, effectsConfig } from "../../effects-config.js";

/* import {
  createParticleSystem,
  destroyParticleSystem,
} from "@newkrok/three-particles/src/js/effects/three-particles"; */

/* import { MODULE_ID } from "../../three-game/world.js";
import { MathUtils } from "three"; */

//import { shoot } from "../../three-game/bullet-manager.js";

//import { AudioId } from "../../assets-config.js";

//import { playAudio } from "../../game-engine/audio/audio.js";

const WeaponType = {
  Unarmed: 0,
  Machete: 1,
  Pistol: 2,
  RIFLE: 3,
};

let _target = null;
let _world = null;

let isMovementBlocked = false;
let selectedWeaponType = WeaponType.Unarmed;

const jumpForceDuringWalk = 10;
const jumpForceDuringRun = 13;

let stamina = 100;
const staminaRegenerationRatio = 20;
const jumpStaminaCost = 5;
const shootStaminaCost = 1;
const runStaminaCostRatio = 15;

const jumpTimeout = 200;
const slashTimeout = 1000;
const shootTimeout = 100;
const weaponChangeTimeout = 600;

let staminaBar = null;
let crosshairs = null;
let isShootingActive = false;

const clearAimState = () => {
  _world.camera.disableAimZoom();
  _target.useAim = false;
};

export const setUnitControllerTarget = ({ target, world }) => {
  _target = target;
  _world = world;

  onUnitAction({
    action: UnitAction.Jump,
    callback: () => {
      if (_target.onGround) {
        _target.jump();
        /*_target.isOnGround = false;
        _target.isJumpTriggered = true;
        _target.physics.velocity.y =
          stamina >= jumpStaminaCost
            ? unitActionState.run.pressed
              ? jumpForceDuringRun
              : jumpForceDuringWalk
            : (stamina / jumpStaminaCost) * jumpForceDuringWalk;
        stamina = Math.max(0, stamina - jumpStaminaCost);*/
        /*playAudio({
            audioId: AudioId.Jump,
            cacheId: AudioId.Jump,
          });*/
      }
    },
  });

  onUnitAction({
    action: UnitAction.Attack,
    callback: () => (isShootingActive = true),
  });

  onUnitAction({
    action: UnitAction.AttackFinish,
    callback: () => (isShootingActive = false),
  });

  const chooseRifle = () => {
    if (!_target.isWeaponChangeTriggered) {
      // setTimeout(() => {
      if (_target) {
        if (selectedWeaponType !== WeaponType.RIFLE) {
          selectedWeaponType = WeaponType.RIFLE;
          //_target.usePistol();

          /*playAudio({
              audioId: AudioId.ChangeToPistol,
              cacheId: AudioId.ChangeToPistol,
            });*/
        } else {
          selectedWeaponType = WeaponType.Unarmed;
          _target.useUnarmed();
          clearAimState();
        }
      }
      // }, 500);
      if (selectedWeaponType === WeaponType.RIFLE) {
        /*playAudio({
          audioId: AudioId.ChangeToPistol,
          cacheId: AudioId.ChangeToPistol,
        });*/
      }
      _target.isWeaponChangeTriggered = true;
    }
  };

  onUnitAction({
    action: UnitAction.Aim,
    callback: () => {
      const zoom = () => {
        _target.useAim = !_target.useAim;
        if (_target.useAim) _world.camera.useAimZoom();
        else clearAimState();
        /*playAudio({
            audioId: AudioId.Aim,
            cacheId: AudioId.Aim,
          });*/
      };

      if (selectedWeaponType !== WeaponType.RIFLE) {
        chooseRifle();
        zoom();
      } else zoom();
    },
  });

  onUnitAction({
    action: UnitAction.ChooseWeapon1,
    callback: () => {
      if (!_target.isWeaponChangeTriggered && _target.onGround) {
        setTimeout(() => {
          if (_target) {
            if (selectedWeaponType !== WeaponType.Machete) {
              selectedWeaponType = WeaponType.Machete;
              _target.useMachete();
              clearAimState();
              /*playAudio({
                audioId: AudioId.ChangeToMachete,
                cacheId: AudioId.ChangeToMachete,
              });*/
            } else {
              selectedWeaponType = WeaponType.Unarmed;
              _target.useUnarmed();
              clearAimState();
            }
          }
        }, 300);
        if (selectedWeaponType === WeaponType.Machete) {
          /*playAudio({
            audioId: AudioId.ChangeToMachete,
            cacheId: AudioId.ChangeToMachete,
          });*/
        }
        _target.isWeaponChangeTriggered = true;
      }
    },
  });

  onUnitAction({
    action: UnitAction.ChooseWeapon2,
    callback: () => {
      if (!_target.isWeaponChangeTriggered && _target.onGround) {
        chooseRifle();
      }
    },
  });
};

export const updateUnitController = ({ now, delta }) => {
  if (_target) {
    const {
      viewRotation,
      physics,
      /* isJumpTriggered, */
      /* jumpStartTime, */
      wasSlashTriggered,
      isSlashTriggered,
      slashStartTime,
      wasShootTriggered,
      isShootTriggered,
      shootStartTime,
      wasWeaponChangeTriggered,
      isWeaponChangeTriggered,
      weaponChangeStartTime,
      useAim,
    } = _target;

    const cameraRotation = _world.camera.getRotation().clone();

    const { modules, scene /* , camera */ } = _world;
    /*const { physicsWorld, colliders } = modules.find(
      ({ id }) => id === MODULE_ID.PHYSICS
    );*/

    isMovementBlocked = false;
    //isSlashTriggered || isShootTriggered || isWeaponChangeTriggered;
    /*
    _target.isClimbingUp = false;
    _target.shimmyVelocity = 0;
    const cameraRotation = _world.camera.getRotation();
*/
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
      (stamina > 0 && unitActionState.run.pressed ? baseSpeed * 2 : baseSpeed) *
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
      _target.viewRotation += diff * (delta / 0.1);
      _target.model.rotation.y = Math.PI - _target.viewRotation + Math.PI;

      /*physics.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        -_target.viewRotation
      );*/

      let normalizedDiff = Math.abs(diff);
      normalizedDiff -= normalizedDiff > Math.PI ? Math.PI : 0;

      velocityMultiplier =
        normalizedDiff > 0.9 ? 0 : (Math.PI - normalizedDiff) / Math.PI;
      if (selectedWeaponType != WeaponType.Unarmed) velocityMultiplier *= 0.9;

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

    if (crosshairs) crosshairs.style.opacity = _target.useAim ? 1 : 0;
    else crosshairs = document.querySelector("#crosshairs");

    if (
      isSlashTriggered &&
      wasSlashTriggered &&
      now - slashStartTime > slashTimeout
    ) {
      _target.wasSlashTriggered = false;
      _target.isSlashTriggered = false;
    }

    if (
      isShootTriggered &&
      wasShootTriggered &&
      now - shootStartTime > shootTimeout
    ) {
      _target.wasShootTriggered = false;
      _target.isShootTriggered = false;
    }

    const raycaster = new THREE.Raycaster(
      _world.camera.instance.getWorldPosition(new THREE.Vector3()),
      _world.camera.instance.getWorldDirection(new THREE.Vector3()),
      0,
      100
    );

    const projectileStartSocket = _target.getSocket(
      ModelSocketId.PROJECTILE_START
    );
    const bulletStartPosition = projectileStartSocket.getWorldPosition(
      new THREE.Vector3()
    );
    const intersects = /* raycaster.intersectObjects(colliders, false) */ [];
    /*let aimingDirection;
    let aimingPosition;
    if (intersects.length > 0) {
      aimingPosition = intersects[0].point;
      aimingDirection = new THREE.Vector3()
        .subVectors(aimingPosition, bulletStartPosition)
        .normalize();
    } else {
      aimingPosition = camera.instance
        .getWorldPosition(new THREE.Vector3())
        .addScaledVector(
          camera.instance.getWorldDirection(new THREE.Vector3()),
          20
        );
      aimingDirection = new THREE.Vector3()
        .subVectors(aimingPosition, bulletStartPosition)
        .normalize();
    }
    _target.aimingPosition = aimingPosition;
    _target.aimingDirection = aimingDirection;

    if (
      isWeaponChangeTriggered &&
      wasWeaponChangeTriggered &&
      now - weaponChangeStartTime > weaponChangeTimeout
    ) {
      _target.wasWeaponChangeTriggered = false;
      _target.isWeaponChangeTriggered = false;
    }
    if (
      isShootingActive &&
      !_target.isShootTriggered &&
      _target.useAim &&
      selectedWeaponType === WeaponType.RIFLE &&
      stamina >= shootStaminaCost
    ) {
      _target.isShootTriggered = true;
      stamina = Math.max(0, stamina - shootStaminaCost);

      const shootingEffect = createParticleSystem(
        effectsConfig[EffectId.SHOOTING]
      );
      projectileStartSocket.add(shootingEffect);
      setTimeout(() => destroyParticleSystem(shootingEffect), 1000);

      shoot({
        bulletStartPosition,
        aimingDirection,
        camera: camera,
        //physicsWorld,
        scene: scene,
      });
    }*/
  }
};
