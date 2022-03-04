import {
  UnitAction,
  initUnitActions,
  onUnitAction,
  updateUnitActions,
} from "./control/unit-action-manager";

import { MODULE_ID } from "../three-game/modules/modules";
import { createTPSCamera } from "./tps-camera";
import { createWorld } from "../three-game/world";
import { updateUnitController } from "./control/unit-controller";

export const createTPSWorld = ({
  target,
  assetsConfig,
  worldConfig,
  characterConfig,
}) => {
  let _onUpdate;

  const camera = createTPSCamera();

  const promise = new Promise((resolve, reject) => {
    try {
      createWorld({
        target,
        assetsConfig,
        worldConfig,
        characterConfig,
        camera: camera.instance,
        characterTickRoutine: (character) => {
          character.updateLookAtPosition({
            position: character.useAim ? character.aimingPosition : null,
            rotation: camera.getRotation(),
          });
        },
      })
        .then((world) => {
          world.renderer.domElement.onclick =
            world.renderer.domElement.requestPointerLock;

          camera.init({
            worldOctree: world.getModule(MODULE_ID.OCTREE).worldOctree,
          });

          const update = (cycleData) => {
            camera.update();
            updateUnitActions();
            updateUnitController(cycleData);
            _onUpdate && _onUpdate(cycleData);
          };
          world.onUpdate(update);

          initUnitActions();
          onUnitAction({
            action: UnitAction.RotateCamera,
            callback: ({ x, y }) => camera.updateRotation({ x, y }),
          });

          resolve({
            ...world,
            camera,
            onUpdate: (onUpdate) => (_onUpdate = onUpdate),
          });
        })
        .catch((e) => console.log(`Ops! ${e}`));
    } catch (e) {
      console.log(`Ops! ${e}`);
    }
  });

  return promise;
};
