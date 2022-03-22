import {
  UnitAction,
  initUnitActions,
  onUnitAction,
  updateUnitActions,
} from "./control/unit-action-manager";

import { MODULE_ID } from "@newkrok/three-game/src/js/newkrok/three-game/modules/modules.js";
import { createTPSCamera } from "./tps-camera";
import { createWorld } from "@newkrok/three-game/src/js/newkrok/three-game/world.js";
import { updateUnitController } from "./control/unit-controller";

export const createTPSWorld = ({
  target,
  assetsConfig,
  worldConfig,
  characterConfig,
}) => {
  let _onUpdate;

  const camera = createTPSCamera();
  const onLoaded = worldConfig.onLoaded;

  const promise = new Promise((resolve, reject) => {
    try {
      createWorld({
        target,
        assetsConfig,
        worldConfig: { ...worldConfig, onLoaded: null },
        characterConfig,
        camera: camera.instance,
        characterTickRoutine: (character) => {
          character.updateAimPosition(
            character.useAim ? character.aimingPosition : null
          );
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

          const tpsWorld = {
            ...world,
            camera,
            onUpdate: (onUpdate) => (_onUpdate = onUpdate),
          };
          onLoaded && onLoaded(tpsWorld);
          resolve(tpsWorld);
        })
        .catch((e) => console.log(`Ops! ${e}`));
    } catch (e) {
      console.log(`Ops! ${e}`);
    }
  });

  return promise;
};
