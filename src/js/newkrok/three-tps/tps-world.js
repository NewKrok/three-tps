import {
  createWorld,
  getDefaultWorldConfig,
} from "@newkrok/three-game/src/js/newkrok/three-game/world.js";

import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createTPSCamera } from "./tps-camera";
import { deepMerge } from "@newkrok/three-utils/src/js/newkrok/three-utils/object-utils.js";

export const getTPSWorldConfig = () =>
  JSON.parse(JSON.stringify(TPS_WORLD_CONFIG));

const TPS_WORLD_CONFIG = {
  ...getDefaultWorldConfig(),
  tpsCamera: {
    stopDuringPause: true,
    maxDistance: 3,
    positionOffset: { x: 0, y: 0, z: 0 },
    yBoundaries: { min: 0, max: Math.PI },
    cameraCollisionRadius: 0.2,
    initialRotation: { x: 0, y: 2 },
    lerp: {
      position: {
        collision: 60,
        normal: 10,
      },
      distance: {
        collision: 60,
        normal: 4,
      },
      targetRotation: 6,
    },
  },
};

export const createTPSWorld = ({ target, worldConfig }) => {
  const tpsCamera = createTPSCamera(worldConfig.tpsCamera);
  const onLoaded = worldConfig.onLoaded;

  const promise = new Promise((resolve, reject) => {
    try {
      createWorld({
        target,
        worldConfig: { ...worldConfig, onLoaded: null },
        camera: tpsCamera.instance,
      })
        .then((world) => {
          tpsCamera.init({
            worldOctree: world.getModule(WorldModuleId.OCTREE).worldOctree,
          });

          world.on.update((cycleData) => {
            tpsCamera.update(cycleData);
          });

          const tpsWorld = deepMerge(
            world,
            {
              tpsCamera,
            },
            { applyToFirstObject: true }
          );
          onLoaded && onLoaded(tpsWorld);
          resolve(tpsWorld);
        })
        .catch((e) => console.log(`Ops! ${e.stack}`));
    } catch (e) {
      console.log(`Ops! ${e.stack}`);
    }
  });

  return promise;
};
