import {
  UnitAction,
  initUnitActions,
  onUnitAction,
  updateUnitActions,
} from "./control/unit-action-manager";

import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createTPSCamera } from "./tps-camera";
import { createWorld } from "@newkrok/three-game/src/js/newkrok/three-game/world.js";
import { deepMerge } from "@newkrok/three-utils/src/js/newkrok/three-utils/object-utils.js";
import { updateUnitController } from "./control/unit-controller";

export const createTPSWorld = ({
  target,
  assetsConfig,
  worldConfig,
  unitConfig,
}) => {
  let _onUpdate;

  const tpsCamera = createTPSCamera();
  const onLoaded = worldConfig.onLoaded;

  const promise = new Promise((resolve, reject) => {
    try {
      createWorld({
        target,
        assetsConfig,
        worldConfig: { ...worldConfig, onLoaded: null },
        unitConfig,
        camera: tpsCamera.instance,
      })
        .then((world) => {
          world.renderer.domElement.onclick =
            world.renderer.domElement.requestPointerLock;

          tpsCamera.init({
            worldOctree: world.getModule(WorldModuleId.OCTREE).worldOctree,
          });

          const update = (cycleData) => {
            tpsCamera.update();
            updateUnitActions();
            updateUnitController(cycleData);
            _onUpdate && _onUpdate(cycleData);
          };
          world.onUpdate(update);

          initUnitActions();
          onUnitAction({
            action: UnitAction.RotateCamera,
            callback: ({ x, y }) => tpsCamera.updateRotation({ x, y }),
          });

          const tpsWorld = deepMerge(
            world,
            {
              tpsCamera,
              onUpdate: (onUpdate) => (_onUpdate = onUpdate),
            },
            { applyToFirstObject: true }
          );
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
