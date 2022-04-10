import {
  UnitActionId,
  unitControllerConfig,
} from "@newkrok/three-game/src/js/newkrok/three-game/boilerplates/unit-controller-boilerplates.js";

import { ButtonKey } from "@newkrok/three-game/src/js/newkrok/three-game/control/gamepad.js";
import { Mouse } from "@newkrok/three-game/src/js/newkrok/three-game/control/mouse.js";
import { TPSUnitModuleId } from "@newkrok/three-tps/src/js/newkrok/three-tps/modules/tps-module-enums.js";

export const TPSUnitActionId = {
  ...UnitActionId,
  CAMERA: "CAMERA",
  AIM: "AIM",
};

export const tpsUnitControllerConfig = {
  actionConfig: [
    ...unitControllerConfig.actionConfig,
    {
      actionId: UnitActionId.CAMERA,
      customTrigger: (trigger) => {
        document.addEventListener("mousemove", ({ movementX, movementY }) => {
          trigger({ x: movementX / 350, y: movementY / 350 });
        });
      },
      gamepadButtons: [ButtonKey.LeftAxisX, ButtonKey.LeftAxisY],
    },
    {
      actionId: UnitActionId.AIM,
      mouse: [Mouse.RIGHT_BUTTON],
      gamepadButtons: [ButtonKey.LeftTrigger],
    },
  ],

  handlers: [
    ...unitControllerConfig.handlers,
    {
      actionId: UnitActionId.FORWARD,
      callback: ({ unit, value }) => {
        const tpsMovementModule = unit.getModule(TPSUnitModuleId.TPS_MOVEMENT);
        tpsMovementModule.setForwardValue(value);
      },
    },
    {
      actionId: UnitActionId.BACKWARD,
      callback: ({ unit, value }) => {
        const tpsMovementModule = unit.getModule(TPSUnitModuleId.TPS_MOVEMENT);
        tpsMovementModule.setBackwardValue(value);
      },
    },
    {
      actionId: UnitActionId.LEFT,
      callback: ({ unit, value }) => {
        const tpsMovementModule = unit.getModule(TPSUnitModuleId.TPS_MOVEMENT);
        tpsMovementModule.setLeftValue(value);
      },
    },
    {
      actionId: UnitActionId.RIGHT,
      callback: ({ unit, value }) => {
        const tpsMovementModule = unit.getModule(TPSUnitModuleId.TPS_MOVEMENT);
        tpsMovementModule.setRightValue(value);
      },
    },
    {
      actionId: UnitActionId.CAMERA,
      callback: ({ world, value: { x, y } }) => {
        world.tpsCamera.updateRotation({ x, y });
      },
    },
    {
      actionId: UnitActionId.AIM,
      callback: ({ unit, world }) => {
        unit.userData.useAim = !unit.userData.useAim;
        if (unit.userData.useAim) world.tpsCamera.useAimZoom();
        else {
          world.tpsCamera.disableAimZoom();
          unit.userData.useAim = false;
        }
      },
    },
  ],
};
