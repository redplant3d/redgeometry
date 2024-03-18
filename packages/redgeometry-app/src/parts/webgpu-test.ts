import {
    KeyboardButtons,
    MouseButtons,
    inputReceiverPlugin,
    inputSenderPlugin,
    type InputData,
    type InputSenderData,
} from "redgeometry/src/ecs-plugins/input";
import { timePlugin, type TimeData } from "redgeometry/src/ecs-plugins/time";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, DefaultWorldScheduleId, EntityId } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import { DEFAULT_START_SCHEDULE, DEFAULT_STOP_SCHEDULE, DEFAULT_UPDATE_SCHEDULE } from "redgeometry/src/ecs/world";
import { Matrix4 } from "redgeometry/src/primitives/matrix";
import { Point3 } from "redgeometry/src/primitives/point";
import { Quaternion, RotationOrder } from "redgeometry/src/primitives/quaternion";
import { Vector3 } from "redgeometry/src/primitives/vector";
import { throwError } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { createRandomColor, createRandomSeed } from "../data.js";
import {
    appMainPlugin,
    appRemotePlugin,
    type AppCanvasData,
    type AppData,
    type AppInputElementData,
    type WindowResizeEvent,
} from "../ecs.js";
import { ButtonInputElement, ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../input.js";
import type { AssetData, AssetId } from "../render-gpu/asset.js";
import type { CameraBundle, CameraComponent } from "../render-gpu/camera.js";
import { gpuPlugin, type GPUData, type GPUInitData } from "../render-gpu/gpu.js";
import type { Material } from "../render-gpu/material.js";
import { meshRenderPlugin, type Mesh, type MeshBundle, type MeshRenderStateData } from "../render-gpu/mesh.js";
import type { SceneData } from "../render-gpu/scene.js";
import { Visibility, type TransformComponent } from "../render-gpu/transform.js";

export const WEBGPU_TEST_MAIN_WORLD: WorldOptions = {
    id: "webgpu-test-main",
    plugins: [appMainPlugin, mainPlugin, inputSenderPlugin, timePlugin],
    schedules: [DEFAULT_START_SCHEDULE, DEFAULT_UPDATE_SCHEDULE, DEFAULT_STOP_SCHEDULE],
};
export const WEBGPU_TEST_REMOTE_WORLD: WorldOptions = {
    id: "webgpu-test-remote",
    plugins: [appRemotePlugin, remotePlugin, inputReceiverPlugin, gpuPlugin, meshRenderPlugin],
    schedules: [DEFAULT_START_SCHEDULE, DEFAULT_UPDATE_SCHEDULE, DEFAULT_STOP_SCHEDULE],
};

function mainPlugin(world: World): void {
    world.registerData<AppMainData>("appMain");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.addSystem<DefaultSystemStage>({ stage: "start", fn: addInputElementsSystem });
    world.addSystem<DefaultSystemStage>({ stage: "start", fn: writeStateSystem });
    world.addSystem<DefaultSystemStage>({ stage: "start", fn: initMainSystem, awaitMode: "dependency" });
    world.addSystem<DefaultSystemStage>({ stage: "start", fn: waitSystem });

    world.addSystem<DefaultSystemStage>({ stage: "update", fn: writeStateSystem });
    world.addSystem<DefaultSystemStage>({ stage: "update", fn: mainSystem, awaitMode: "dependency" });
    world.addSystem<DefaultSystemStage>({ stage: "update", fn: waitSystem });

    world.addDependency<DefaultSystemStage>({
        stage: "start",
        seq: [addInputElementsSystem, writeStateSystem, initMainSystem, waitSystem],
    });
    world.addDependency<DefaultSystemStage>({
        stage: "update",
        seq: [writeStateSystem, mainSystem, waitSystem],
    });
}

function remotePlugin(world: World): void {
    world.registerData<AppRemoteData>("appRemote");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

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

type AppMainData = {
    dataId: "appMain";
    countRange: RangeInputElement;
    fovRange: RangeInputElement;
    generatorTextBox: TextBoxInputElement;
    randomizeButton: ButtonInputElement;
    seedTextBox: TextBoxInputElement;
    transformComboBox: ComboBoxInputElement;
    updateButton: ButtonInputElement;
};

type AppRemoteData = {
    dataId: "appRemote";
    count: number;
    random: Random;
    materialHandles: AssetId<Material>[];
    meshHandles: AssetId<Mesh>[];
    parentEntity: EntityId | undefined;
};

type AppStateData = {
    dataId: "appState";
    count: number;
    fov: number;
    seed: number;
    transform: string;
};

type AppCommandEvent = {
    eventId: "appCommand";
    type: "randomize" | "update";
};

type TestComponent = {
    componentId: "test";
};

function waitSystem(): void {}

function initMainSystem(world: World): Promise<void> {
    const appData = world.readData<AppData>("app");
    const appStateData = world.readData<AppStateData>("appState");
    const appCanvasData = world.readData<AppCanvasData>("appCanvas");

    world.writeData<InputSenderData>({
        dataId: "inputSender",
        receiverId: WEBGPU_TEST_REMOTE_WORLD.id,
        keyboardEventHandler: self,
        mouseEventHandler: appData.canvas,
    });

    const channel = world.getChannel(WEBGPU_TEST_REMOTE_WORLD.id);
    channel.queueData<AppStateData>(appStateData);

    if (appCanvasData.canvas instanceof OffscreenCanvas) {
        channel.queueData<AppCanvasData>(appCanvasData, [appCanvasData.canvas]);
    } else {
        channel.queueData<AppCanvasData>(appCanvasData);
    }

    return channel.runScheduleAsync<DefaultWorldScheduleId>("start");
}

function initRemoteSystem(world: World): void {
    const { canvas } = world.readData<AppCanvasData>("appCanvas");
    const { seed } = world.readData<AppStateData>("appState");

    const context = canvas.getContext("webgpu") as GPUCanvasContext | null;

    if (context === null) {
        throwError("Unable to create WebGPU rendering context");
    }

    world.writeData<GPUInitData>({
        dataId: "gpuInit",
        alphaMode: "premultiplied",
        context,
        deviceDescriptor: undefined,
        gpu: navigator.gpu,
        requestAdapterOptions: undefined,
    });

    world.writeData<AppRemoteData>({
        dataId: "appRemote",
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

function addInputElementsSystem(world: World): void {
    const seed = createRandomSeed();

    const { inputElements } = world.readData<AppInputElementData>("appInputElement");

    const randomizeButton = new ButtonInputElement("randomize", "randomize");
    randomizeButton.addEventListener("click", () => {
        world.queueEvent<AppCommandEvent>({ eventId: "appCommand", type: "randomize" });
    });
    inputElements.push(randomizeButton);

    const seedTextBox = new TextBoxInputElement("seed", seed.toString());
    seedTextBox.setStyle("width: 80px");
    inputElements.push(seedTextBox);

    const generatorTextBox = new TextBoxInputElement("generator", "0");
    generatorTextBox.setStyle("width: 25px");
    inputElements.push(generatorTextBox);

    const updateButton = new ButtonInputElement("update", "update");
    updateButton.addEventListener("click", () => {
        world.queueEvent<AppCommandEvent>({ eventId: "appCommand", type: "update" });
    });
    inputElements.push(updateButton);

    const fovRange = new RangeInputElement("fov", "30", "150", "65");
    fovRange.setStyle("width: 200px");
    inputElements.push(fovRange);

    const countRange = new RangeInputElement("count", "0", "1000000", "15000");
    countRange.setStyle("width: 200px");
    inputElements.push(countRange);

    const transformComboBox = new ComboBoxInputElement("transform", "none");
    transformComboBox.setOptionValues("none", "rotate");
    inputElements.push(transformComboBox);

    world.writeData<AppMainData>({
        dataId: "appMain",
        countRange,
        fovRange,
        generatorTextBox,
        randomizeButton,
        seedTextBox,
        transformComboBox,
        updateButton,
    });
}

function writeStateSystem(world: World): void {
    const appMainData = world.readData<AppMainData>("appMain");

    world.writeData<AppStateData>({
        dataId: "appState",
        count: appMainData.countRange.getInt(),
        fov: appMainData.fovRange.getInt(),
        seed: appMainData.seedTextBox.getInt(),
        transform: appMainData.transformComboBox.getValue(),
    });
}

function mainSystem(world: World): Promise<void> {
    const timeData = world.readData<TimeData>("time");
    const appStateData = world.readData<AppStateData>("appState");
    const windowResizeEvents = world.readEvents<WindowResizeEvent>("windowResize");
    const appCommandEvents = world.readEvents<AppCommandEvent>("appCommand");

    const channel = world.getChannel(WEBGPU_TEST_REMOTE_WORLD.id);
    channel.queueData(timeData);
    channel.queueData(appStateData);
    channel.queueEvents(windowResizeEvents);
    channel.queueEvents(appCommandEvents);

    return channel.runScheduleAsync<DefaultWorldScheduleId>("update");
}

function beginFrameSystem(world: World): void {
    const { context, device, gpu } = world.readData<GPUData>("gpu");
    const { transform } = world.readData<AppStateData>("appState");
    const { time } = world.readData<TimeData>("time");
    const { parentEntity } = world.readData<AppRemoteData>("appRemote");

    const windowResizeEvent = world.readLatestEvent<WindowResizeEvent>("windowResize");

    if (windowResizeEvent !== undefined) {
        const { alphaMode } = world.readData<GPUInitData>("gpuInit");

        context.configure({ alphaMode, device, format: gpu.getPreferredCanvasFormat() });

        const meshRenderStateData = world.readData<MeshRenderStateData>("meshRenderState");
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
    const appRemoteData = world.readData<AppRemoteData>("appRemote");
    const assetData = world.readData<AssetData>("asset");

    const { random } = appRemoteData;

    for (let i = 0; i < 25; i++) {
        const materialHandle = assetData.materials.add({
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

    const meshHandle = assetData.meshes.add({
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
    const appRemoteData = world.readData<AppRemoteData>("appRemote");
    const appStateData = world.readData<AppStateData>("appState");

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

export function cameraMoveSystem(world: World): void {
    const { keyboard, mouse } = world.readData<InputData>("input");
    const { fov } = world.readData<AppStateData>("appState");
    const { mainCamera } = world.readData<SceneData>("scene");
    const { context } = world.readData<GPUData>("gpu");
    const { delta } = world.readData<TimeData>("time");

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
        v = camRot.mapVector(v);

        camPos = camPos.add(v);
    }

    if (mouse.isPressing(MouseButtons.Mouse3)) {
        let offsetX = 0;
        let offsetY = 0;

        for (const ev of mouse.events) {
            offsetX -= ev.movementX;
            offsetY -= ev.movementY;
        }

        const sens = 1 / 250;
        const yaw = sens * offsetX;
        const pitch = sens * offsetY;

        camRot = camRot.rotateYPre(yaw).rotateX(pitch);
    }

    transform.rotation = camRot;
    transform.translation = camPos;

    world.updateComponent<TransformComponent>(mainCamera, "transform");

    const aspect = context.canvas.width / context.canvas.height;
    const camProj = Matrix4.fromPerspectiveFrustum(fov, aspect, 0.01, 2000);

    // Transform `z` from [-1, 1] to [0, 1]
    camProj.translate(0, 0, 1);
    camProj.scale(1, 1, 0.5);

    camera.projection = camProj;
}
