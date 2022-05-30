import * as THREE from "three";

import {
  PlayerActionId,
  unitControllerConfig,
} from "@newkrok/three-game/src/js/newkrok/three-game/boilerplates/player-controller-boilerplates.js";

import { ButtonKey } from "@newkrok/three-game/src/js/newkrok/three-game/control/gamepad.js";
import { Mouse } from "@newkrok/three-game/src/js/newkrok/three-game/control/mouse-manager.js";
import { TPSUnitModuleId } from "@newkrok/three-tps/src/js/newkrok/three-tps/modules/tps-module-enums.js";

export const TPSPlayerActionId = {
  CAMERA: "CAMERA",
  AIM: "AIM",
};

export const tpsUnitControllerConfig = {
  actionConfig: [
    ...unitControllerConfig.actionConfig,
    {
      actionId: TPSPlayerActionId.CAMERA,
      customTrigger: (trigger) => {
        document.addEventListener("mousemove", ({ movementX, movementY }) => {
          trigger({ x: movementX / 350, y: movementY / 350 });
        });
      },
      gamepadButtons: [ButtonKey.LeftAxisX, ButtonKey.LeftAxisY],
    },
    {
      actionId: TPSPlayerActionId.AIM,
      mouse: [Mouse.RIGHT_BUTTON],
      gamepadButtons: [ButtonKey.LeftTrigger],
    },
  ],

  handlers: [
    ...unitControllerConfig.handlers,
    {
      actionId: PlayerActionId.FORWARD,
      callback: ({ target, value }) => {
        const tpsMovementModule = target.getModule(
          TPSUnitModuleId.TPS_MOVEMENT
        );
        tpsMovementModule.setForwardValue(value);
      },
    },
    {
      actionId: PlayerActionId.BACKWARD,
      callback: ({ target, value }) => {
        const tpsMovementModule = target.getModule(
          TPSUnitModuleId.TPS_MOVEMENT
        );
        tpsMovementModule.setBackwardValue(value);
      },
    },
    {
      actionId: PlayerActionId.LEFT,
      callback: ({ target, value }) => {
        const tpsMovementModule = target.getModule(
          TPSUnitModuleId.TPS_MOVEMENT
        );
        tpsMovementModule.setLeftValue(value);
      },
    },
    {
      actionId: PlayerActionId.RIGHT,
      callback: ({ target, value }) => {
        const tpsMovementModule = target.getModule(
          TPSUnitModuleId.TPS_MOVEMENT
        );
        tpsMovementModule.setRightValue(value);
      },
    },
    {
      actionId: TPSPlayerActionId.CAMERA,
      callback: ({ world, value: { x, y } }) => {
        world.tpsCamera.rotate({ x, y });
      },
    },
    {
      actionId: TPSPlayerActionId.AIM,
      callback: ({ target, world }) => {
        target.userData.useAim = !target.userData.useAim;
        if (target.userData.useAim) {
          world.tpsCamera.setMaxDistance(1);
          world.tpsCamera.setPositionOffset(new THREE.Vector3(0.5, 1.5, 0));
          world.tpsCamera.setYBoundaries({ min: 1, max: 2.6 });
        } else {
          world.tpsCamera.setMaxDistance(3);
          world.tpsCamera.setPositionOffset(new THREE.Vector3(0, 1.6, 0));
          world.tpsCamera.setYBoundaries({ max: 2.7 });
        }
      },
    },
  ],
};
