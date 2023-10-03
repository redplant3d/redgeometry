/// <reference types="@webgpu/types" />
import type { World } from "redgeometry/src/ecs/world.js";
import { Matrix4x4 } from "redgeometry/src/primitives/matrix.js";
import { CAMERA_BUNDLE_IDS, type CameraBundle } from "redgeometry/src/render-webgpu/camera.js";
import { gpuPlugin, startGPUSystem, type GPUData, type GPUInitData } from "redgeometry/src/render-webgpu/gpu.js";
import {
    meshRenderPlugin,
    meshRenderSystem,
    type MeshBundle,
    type MeshComponent,
    type MeshRenderStateData,
} from "redgeometry/src/render-webgpu/mesh.js";
import type { SceneData } from "redgeometry/src/render-webgpu/scene.js";
import { requestAnimationFrameSystem, timePlugin, type TimeData } from "redgeometry/src/render-webgpu/time.js";
import { throwError } from "redgeometry/src/utility/debug.js";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random.js";
import { createRandomColor, createRandomSeed } from "../data.js";
import {
    appMainPlugin,
    appRemotePlugin,
    initAppSystem,
    initInputElementsSystem,
    resizeWindowSystem,
    type AppCanvasData,
    type AppInputElementData,
    type WindowResizeEvent,
} from "../ecs.js";
import { ButtonInputElement, ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../input.js";

export const WEBGPU_TEST_MAIN_WORLD = {
    id: "webgpu-test-main",
    plugins: [appMainPlugin, mainPlugin, timePlugin],
};
export const WEBGPU_TEST_REMOTE_WORLD = {
    id: "webgpu-test-remote",
    plugins: [appRemotePlugin, remotePlugin, gpuPlugin, meshRenderPlugin],
};

function mainPlugin(world: World): void {
    world.registerData<AppMainData>("appMain");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.addSystem({ fn: addInputElementsSystem, stage: "start" });
    world.addSystem({ fn: writeStateSystem, stage: "start" });
    world.addSystem({ fn: initMainSystem, stage: "start", mode: "async" });
    world.addSystem({ fn: writeStateSystem });
    world.addSystem({ fn: mainSystem, mode: "async" });

    world.addDependency({
        seq: [initAppSystem, addInputElementsSystem, initInputElementsSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [addInputElementsSystem, writeStateSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [writeStateSystem, initMainSystem, requestAnimationFrameSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [writeStateSystem, mainSystem, requestAnimationFrameSystem],
    });
}

function remotePlugin(world: World): void {
    world.registerData<AppRemoteData>("appRemote");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.addSystem({ fn: initRemoteSystem, stage: "start" });
    world.addSystem({ fn: beginFrameSystem });
    world.addSystem({ fn: spawnSystem });

    world.addDependency({
        seq: [initRemoteSystem, startGPUSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [resizeWindowSystem, beginFrameSystem, spawnSystem, meshRenderSystem],
    });
}

type AppMainData = {
    dataId: "appMain";
    countRange: RangeInputElement;
    generatorTextBox: TextBoxInputElement;
    projectionComboBox: ComboBoxInputElement;
    randomizeButton: ButtonInputElement;
    rotationRange: RangeInputElement;
    seedTextBox: TextBoxInputElement;
    updateButton: ButtonInputElement;
};

type AppRemoteData = {
    dataId: "appRemote";
    count: number;
    random: Random;
};

type AppStateData = {
    dataId: "appState";
    count: number;
    projection: string;
    rotation: number;
    seed: number;
};

type AppCommandEvent = {
    eventId: "appCommand";
    type: "randomize" | "update";
};

function initMainSystem(world: World): Promise<void> {
    const appStateData = world.readData<AppStateData>("appState");
    const appCanvasData = world.readData<AppCanvasData>("appCanvas");

    const channel = world.getChannel(WEBGPU_TEST_REMOTE_WORLD.id);
    channel.queueData<AppStateData>(appStateData);

    if (appCanvasData.canvas instanceof OffscreenCanvas) {
        channel.queueData<AppCanvasData>(appCanvasData, [appCanvasData.canvas]);
    } else {
        channel.queueData<AppCanvasData>(appCanvasData);
    }

    return channel.runStageAsync("start");
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
    });

    const mainCamera = world.createEntity<CameraBundle>(
        { componentId: "camera", projection: Matrix4x4.identity },
        { componentId: "transform", local: Matrix4x4.identity },
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

    const rotationRange = new RangeInputElement("rotation", "0", "200", "100");
    rotationRange.setStyle("width: 200px");
    inputElements.push(rotationRange);

    const projectionComboBox = new ComboBoxInputElement("projection", "orthographic");
    projectionComboBox.setOptionValues("orthographic", "perspective");
    inputElements.push(projectionComboBox);

    const countRange = new RangeInputElement("count", "0", "1000", "10");
    countRange.setStyle("width: 200px");
    inputElements.push(countRange);

    world.writeData<AppMainData>({
        dataId: "appMain",
        countRange,
        generatorTextBox,
        projectionComboBox,
        randomizeButton,
        rotationRange,
        seedTextBox,
        updateButton,
    });
}

function writeStateSystem(world: World): void {
    const appMainData = world.readData<AppMainData>("appMain");

    world.writeData<AppStateData>({
        dataId: "appState",
        count: appMainData.countRange.getInt(),
        projection: appMainData.projectionComboBox.getValue(),
        rotation: appMainData.rotationRange.getInt(),
        seed: appMainData.seedTextBox.getInt(),
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

    return channel.runStageAsync("update");
}

function beginFrameSystem(world: World): void {
    const { rotation, projection } = world.readData<AppStateData>("appState");
    const { context, device, gpu } = world.readData<GPUData>("gpu");
    const { time } = world.readData<TimeData>("time");
    const { canvas } = context;

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

    const a = (0.25 * time + rotation * Math.PI) / 180;

    const view = Matrix4x4.identity;
    view.rotateYAnglePre(a);
    view.rotateXAnglePre(0.5);
    view.translatePre(0, 0, -15);

    let matProj;

    if (projection === "orthographic") {
        matProj = Matrix4x4.fromOrthographic(-10, 10, 10, -10, 1, 2000);
    } else {
        matProj = Matrix4x4.fromPerspectiveFrustum(65, canvas.width / canvas.height, 1, 2000);
    }

    matProj.translatePre(0, 0, 1);
    matProj.scalePre(1, 1, 0.5);

    const { mainCamera } = world.readData<SceneData>("scene");
    const mainCameraComponents = world.getTypedComponents<CameraBundle>(mainCamera, CAMERA_BUNDLE_IDS);

    if (mainCameraComponents !== undefined) {
        mainCameraComponents.camera.projection = matProj;
        mainCameraComponents.transform.local = view;
    }
}

function spawnSystem(world: World): void {
    const appRemoteData = world.readData<AppRemoteData>("appRemote");
    const appStateData = world.readData<AppStateData>("appState");

    const currCount = appRemoteData.count;
    const nextCount = appStateData.count;

    if (currCount <= nextCount) {
        const cubeVertices = [
            -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1,
            -1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1,
            1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1, 1, -1, 1,
            -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, -1,
        ];

        const { random } = appRemoteData;

        for (let i = currCount; i < nextCount; i++) {
            const local = Matrix4x4.identity;
            local.rotateXAnglePre(random.nextFloatBetween(-5, 5));
            local.rotateYAnglePre(random.nextFloatBetween(-5, 5));
            local.rotateZAnglePre(random.nextFloatBetween(-5, 5));
            local.translatePre(
                random.nextFloatBetween(-7.5, 7.5),
                random.nextFloatBetween(-2.5, 5),
                random.nextFloatBetween(-7.5, 7.5),
            );

            const color = createRandomColor(random, 0.5, 1, 1);

            world.createEntity<MeshBundle>(
                {
                    componentId: "mesh",
                    material: { topology: "triangle-list", color },
                    vertices: { type: "Number", array: cubeVertices },
                },
                { componentId: "transform", local },
            );
        }
    } else {
        const query = world.queryEntities<[MeshComponent]>(["mesh"]);

        let i = nextCount;

        for (const entry of query) {
            if (i < currCount) {
                world.destroyEntity(entry.entity);
                i += 1;
            }
        }
    }

    appRemoteData.count = nextCount;
}
