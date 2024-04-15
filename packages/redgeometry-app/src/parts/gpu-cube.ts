import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, EntityId, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { Matrix4 } from "redgeometry/src/primitives/matrix";
import { Point3 } from "redgeometry/src/primitives/point";
import { Quaternion, RotationOrder } from "redgeometry/src/primitives/quaternion";
import { Vector3 } from "redgeometry/src/primitives/vector";
import { throwError } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import type { AppInputData } from "../ecs/app-input.js";
import { ComboBoxInputElement, RangeInputElement } from "../ecs/app-input.js";
import {
    AppMainModule,
    AppRemoteModule,
    type AppCanvasData,
    type AppStateData,
    type WindowResizeEvent,
} from "../ecs/app.js";
import type { AssetId, AssetPlugin } from "../ecs/asset.js";
import type { CameraBundle, CameraComponent } from "../ecs/camera.js";
import { GPUModule, type GPUData, type GPUInitData } from "../ecs/gpu.js";
import {
    KeyboardButtons,
    KeyboardPlugin,
    MouseButtons,
    MousePlugin,
    type InputMouseMotionEvent,
} from "../ecs/input.js";
import type { Material } from "../ecs/material.js";
import { MeshRenderModule, type Mesh, type MeshBundle, type MeshRenderStateData } from "../ecs/mesh.js";
import type { SceneData } from "../ecs/scene.js";
import { type TimeData } from "../ecs/time.js";
import { Visibility, type TransformComponent } from "../ecs/transform.js";
import { createRandomColor } from "../utility/helper.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: RangeInputElement;
    inputFOV: RangeInputElement;
    inputTransform: ComboBoxInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    count: number;
    random: Random;
    materialHandles: AssetId<Material>[];
    meshHandles: AssetId<Mesh>[];
    parentEntity: EntityId | undefined;
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
    fov: number;
    transform: string;
};

type TestComponent = {
    componentId: "test";
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputFOV = new RangeInputElement("fov", "30", "150", "65");
    inputFOV.setStyle("width: 200px");
    inputElements.push(inputFOV);

    const inputCount = new RangeInputElement("count", "0", "1000000", "15000");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    const inputTransform = new ComboBoxInputElement("transform", "none");
    inputTransform.setOptionValues("none", "rotate");
    inputElements.push(inputTransform);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
        inputFOV,
        inputTransform,
    });
}

function initRemoteSystem(world: World): void {
    const { canvas } = world.readData<AppCanvasData>("app-canvas");
    const { seed } = world.readData<AppStateData>("app-state");

    const context = canvas.getContext("webgpu") as GPUCanvasContext | null;

    if (context === null) {
        throwError("Unable to create WebGPU rendering context");
    }

    world.writeData<GPUInitData>({
        dataId: "gpu-init",
        alphaMode: "premultiplied",
        context,
        deviceDescriptor: undefined,
        gpu: navigator.gpu,
        requestAdapterOptions: undefined,
    });

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        count: 0,
        random: RandomXSR128.fromSeedLcg(seed),
        materialHandles: [],
        meshHandles: [],
        parentEntity: undefined,
    });

    const mainCamera = world.createEntity<CameraBundle>(
        undefined,
        {
            componentId: "camera",
            projection: Matrix4.createIdentity(),
            viewProjection: Matrix4.createIdentity(),
        },
        {
            componentId: "transform",
            scale: Vector3.ONE,
            rotation: Quaternion.IDENTITY,
            translation: new Point3(0, 0, 15),
            visible: Visibility.Inherit,
        },
    );

    world.writeData<SceneData>({
        dataId: "scene",
        mainCamera,
    });
}

function writeStateSystem(world: World): void {
    const appMainData = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: appMainData.inputCount.getInt(),
        fov: appMainData.inputFOV.getInt(),
        transform: appMainData.inputTransform.getValue(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function beginFrameSystem(world: World): void {
    const { context, device, gpu } = world.readData<GPUData>("gpu");
    const { transform } = world.readData<AppPartStateData>("app-part-state");
    const { time } = world.readData<TimeData>("time");
    const { parentEntity } = world.readData<AppPartRemoteData>("app-part-remote");

    const windowResizeEvent = world.readLatestEvent<WindowResizeEvent>("window-resize");

    if (windowResizeEvent !== undefined) {
        const { alphaMode } = world.readData<GPUInitData>("gpu-init");

        context.configure({ alphaMode, device, format: gpu.getPreferredCanvasFormat() });

        const meshRenderStateData = world.readData<MeshRenderStateData>("mesh-render-state");
        meshRenderStateData.depthTexture = device.createTexture({
            size: [windowResizeEvent.width, windowResizeEvent.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    if (transform === "rotate" && parentEntity !== undefined) {
        const a = (0.25 * time) / 180;
        const transformComp = world.getComponent<TransformComponent>(parentEntity, "transform");

        if (transformComp !== undefined) {
            transformComp.rotation = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.XYZ);
            world.updateComponent<TransformComponent>(parentEntity, "transform");
        }
    }
}

function initAssetSystem(world: World): void {
    const appRemoteData = world.readData<AppPartRemoteData>("app-part-remote");

    const asset = world.getPlugin<AssetPlugin>("asset");

    const { random } = appRemoteData;

    for (let i = 0; i < 25; i++) {
        const materialHandle = asset.materials.add({
            color: createRandomColor(random, 0.5, 1, 1),
        });
        appRemoteData.materialHandles.push(materialHandle);
    }

    const cubeVertices = [
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, -1,
        1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1,
        -1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1, -1,
        1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, -1,
    ];

    const meshHandle = asset.meshes.add({
        vertices: { type: "number", array: cubeVertices },
    });

    appRemoteData.parentEntity = world.createEntity<[TransformComponent]>(undefined, {
        componentId: "transform",
        rotation: Quaternion.IDENTITY,
        scale: Vector3.ONE,
        translation: Point3.ZERO,
        visible: Visibility.Inherit,
    });

    appRemoteData.meshHandles.push(meshHandle);
}

function spawnSystem(world: World): void {
    const appRemoteData = world.readData<AppPartRemoteData>("app-part-remote");
    const appStateData = world.readData<AppPartStateData>("app-part-state");

    const currCount = appRemoteData.count;
    const nextCount = appStateData.count;

    const maxCount = Math.abs(currCount - nextCount);
    const minCount = Math.min(maxCount, 2500);

    if (currCount < nextCount) {
        const { random, materialHandles, meshHandles, parentEntity } = appRemoteData;

        for (let i = 0; i < minCount; i++) {
            world.createEntity<[TestComponent, ...MeshBundle]>(
                parentEntity,
                { componentId: "test" },
                { componentId: "mesh", handle: meshHandles[i % meshHandles.length] },
                { componentId: "material", handle: materialHandles[i % materialHandles.length] },
                {
                    componentId: "transform",
                    scale: new Vector3(
                        random.nextFloatBetween(2 ** -8, 2 ** -6),
                        random.nextFloatBetween(2 ** -8, 2 ** -6),
                        random.nextFloatBetween(2 ** -8, 2 ** -6),
                    ),
                    rotation: Quaternion.fromRotationEuler(
                        random.nextFloatBetween(0, 2 * Math.PI),
                        random.nextFloatBetween(0, 2 * Math.PI),
                        random.nextFloatBetween(0, 2 * Math.PI),
                        RotationOrder.XYZ,
                    ),
                    translation: new Point3(
                        random.nextFloatBetween(-5, 5),
                        random.nextFloatBetween(-5, 5),
                        random.nextFloatBetween(-5, 5),
                    ),
                    visible: Visibility.Inherit,
                },
            );
        }

        appRemoteData.count += minCount;

        // log.info("Created {} entities", nextCount - currCount);
    }

    if (currCount > nextCount) {
        const query = world.queryEntities<[TestComponent]>(["test"]);

        let i = 0;

        while (query.next()) {
            const entityId = query.getEntityId();

            if (i < minCount) {
                world.destroyEntity(entityId);
                i += 1;
            }
        }

        appRemoteData.count -= minCount;

        // log.info("Deleted {} entities", currCount - nextCount);
    }
}

function cameraMoveSystem(world: World): void {
    const { fov } = world.readData<AppPartStateData>("app-part-state");
    const { mainCamera } = world.readData<SceneData>("scene");
    const { context } = world.readData<GPUData>("gpu");
    const { delta } = world.readData<TimeData>("time");

    const keyboard = world.getPlugin<KeyboardPlugin>("keyboard");
    const mouse = world.getPlugin<MousePlugin>("mouse");

    const camera = world.getComponent<CameraComponent>(mainCamera, "camera");
    const transform = world.getComponent<TransformComponent>(mainCamera, "transform");

    if (camera === undefined || transform === undefined) {
        return;
    }

    let camRot = transform.rotation;
    let camPos = transform.translation;

    let vel = 0.005;
    let x = 0;
    let y = 0;
    let z = 0;

    if (keyboard.isPressing(KeyboardButtons.KeyW)) z -= 1;
    if (keyboard.isPressing(KeyboardButtons.KeyS)) z += 1;
    if (keyboard.isPressing(KeyboardButtons.KeyA)) x -= 1;
    if (keyboard.isPressing(KeyboardButtons.KeyD)) x += 1;
    if (keyboard.isPressing(KeyboardButtons.KeyC)) y -= 1;
    if (keyboard.isPressing(KeyboardButtons.Space)) y += 1;
    if (keyboard.isPressing(KeyboardButtons.ShiftLeft)) vel *= 3;

    let v = new Vector3(x, y, z);

    if (!v.eq(Vector3.ZERO)) {
        v = v.unitOrZero().mul(delta * vel);
        v = camRot.mulVec(v);

        camPos = camPos.add(v);
    }

    if (mouse.isPressing(MouseButtons.Mouse3)) {
        let dx = 0;
        let dy = 0;

        for (const ev of world.readEvents<InputMouseMotionEvent>("input-mouse-motion")) {
            dx -= ev.movementX;
            dy -= ev.movementY;
        }

        const sens = 1 / 250;
        const yaw = sens * dx;
        const pitch = sens * dy;

        camRot = camRot.rotateYPre(yaw).rotateX(pitch);
    }

    transform.rotation = camRot;
    transform.translation = camPos;

    world.updateComponent<TransformComponent>(mainCamera, "transform");

    const fovRad = fov * (Math.PI / 180);
    const aspect = context.canvas.width / context.canvas.height;
    const camProj = Matrix4.fromPerspective(fovRad, aspect, 0.1, 100);

    camera.projection = camProj;
}

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "main";

    public setup(world: World): void {
        world.registerData<AppPartMainData>("app-part-main");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystem<DefaultSystemStage>({ stage: "start", fn: initMainSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start", fn: writeStateSystem });

        world.addSystem<DefaultSystemStage>({ stage: "update", fn: writeStateSystem });

        world.addDependency<DefaultSystemStage>({
            stage: "start",
            seq: [initMainSystem, writeStateSystem],
        });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "remote";

    public setup(world: World): void {
        world.addModules([new GPUModule(), new MeshRenderModule()]);

        world.registerData<AppPartRemoteData>("app-part-remote");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystem<DefaultSystemStage>({ stage: "start", fn: initRemoteSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start", fn: initAssetSystem });

        world.addSystem<DefaultSystemStage>({ stage: "update", fn: cameraMoveSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update", fn: beginFrameSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update", fn: spawnSystem });

        world.addDependency<DefaultSystemStage>({
            stage: "start",
            seq: [initRemoteSystem, initAssetSystem],
        });
        world.addDependency<DefaultSystemStage>({
            stage: "update",
            seq: [cameraMoveSystem, beginFrameSystem, spawnSystem],
        });
    }
}

export const GPU_CUBE_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const GPU_CUBE_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};
