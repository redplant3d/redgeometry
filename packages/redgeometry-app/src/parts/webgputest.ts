import { timePlugin, World } from "redgeometry/src/ecs";
import { Matrix4x4 } from "redgeometry/src/primitives";
import { GPUData, MeshComponent, MeshMaterial, meshRenderPlugin } from "redgeometry/src/render-webgpu";
import { TransformComponent } from "redgeometry/src/render-webgpu/transform";
import { Random, RandomXSR128 } from "redgeometry/src/utility";
import { AppContextGPU } from "../context";
import { createRandomColor } from "../data";
import { ComboBoxInputElement, RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

const MATERIAL_RED_LINE: Readonly<MeshMaterial> = {
    color: { r: 1, g: 0, b: 0, a: 0 },
    topology: "line-list",
};

const MATERIAL_GREEN_LINE: Readonly<MeshMaterial> = {
    color: { r: 0, g: 1, b: 0, a: 0 },
    topology: "line-list",
};

const MATERIAL_BLUE_LINE: Readonly<MeshMaterial> = {
    color: { r: 0, g: 0, b: 1, a: 0 },
    topology: "line-list",
};

const MATERIAL_PLANE: Readonly<MeshMaterial> = {
    color: { r: 0.5, g: 0.5, b: 0.5, a: 0.7 },
    topology: "triangle-list",
};

export class WebGpuTestAppPart implements AppPart {
    private context: AppContextGPU;
    public launcher: AppLauncher;
    public inputCount: RangeInputElement;
    public inputProjection: ComboBoxInputElement;
    public inputRotation: RangeInputElement;
    public world: World;

    public constructor(launcher: AppLauncher, context: AppContextGPU) {
        this.launcher = launcher;
        this.context = context;

        this.inputRotation = new RangeInputElement("rotation", "0", "200", "100");
        this.inputRotation.setStyle("width: 200px");

        this.inputProjection = new ComboBoxInputElement("projection", "orthographic");
        this.inputProjection.setOptionValues("orthographic", "perspective");

        this.inputCount = new RangeInputElement("count", "0", "100", "10");
        this.inputCount.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputCount.setStyle("width: 200px");

        this.world = new World();
        this.world.registerData<AppContextData>("appContext");
        this.world.addPlugin(timePlugin);
        this.world.addSystem({ fn: initializeSystem, startup: true, args: [this] });
        this.world.addSystem({ fn: spawnSystem });
        this.world.addSystem({ fn: beginFrameSystem, args: [this, this.context] });
        this.world.addPlugin(meshRenderPlugin);

        const { canvas, currentTextureView, device, format } = this.context;
        this.world.writeData<GPUData>({
            dataId: "gpuData",
            mvpMatrix: Matrix4x4.identity,
            currentTextureView,
            device,
            format,
            canvas,
        });
    }

    public create(): void {
        this.reset();

        this.world.start();
    }

    public render(): void {
        return;
    }

    public reset(): void {
        this.world.clearEntities();
    }

    public update(_delta: number): void {
        return;
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputRotation);
        this.launcher.addAppInput(this.inputProjection);
        this.launcher.addAppInput(this.inputCount);
    }
}

interface AppContextData {
    dataId: "appContext";
    part: WebGpuTestAppPart;
    random: Random;
    count: number;
}

function initializeSystem(world: World, part: WebGpuTestAppPart): void {
    const seed = part.launcher.inputSeed.getInt();
    const random = RandomXSR128.fromSeedLcg(seed);

    world.writeData<AppContextData>({ dataId: "appContext", part, random, count: 0 });

    const d = 5;

    // world.createEntity<[MeshComponent]>({
    //     componentId: "mesh",
    //     material: MATERIAL_RED_LINE,
    //     vertices: { type: "Number", array: [-1000, 0, 0, 1000, 0, 0] },
    // });

    // world.createEntity<[MeshComponent]>({
    //     componentId: "mesh",
    //     material: MATERIAL_GREEN_LINE,
    //     vertices: { type: "Number", array: [0, -1000, 0, 0, 1000, 0] },
    // });

    // world.createEntity<[MeshComponent]>({
    //     componentId: "mesh",
    //     material: MATERIAL_BLUE_LINE,
    //     vertices: { type: "Number", array: [0, 0, -1000, 0, 0, 1000] },
    // });

    // world.createEntity<[MeshComponent]>({
    //     componentId: "mesh",
    //     material: MATERIAL_PLANE,
    //     vertices: { type: "Number", array: [d, 0, d, d, 0, -d, -d, 0, d, -d, 0, -d, -d, 0, d, d, 0, -d] },
    // });
}

function spawnSystem(world: World): void {
    const appContext = world.readData<AppContextData>("appContext");
    const { part, count, random } = appContext;

    const newCount = part.inputCount.getInt();

    if (count <= newCount) {
        for (let i = count; i < newCount; i++) {
            const array = [
                -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1,
                1, -1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, 1,
                -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1,
                1, -1, 1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, -1,
            ];
            const local = Matrix4x4.identity;
            local.rotateXAnglePre(random.nextFloatBetween(-5, 5));
            local.rotateYAnglePre(random.nextFloatBetween(-5, 5));
            local.rotateZAnglePre(random.nextFloatBetween(-5, 5));
            local.translatePre(
                random.nextFloatBetween(-7.5, 7.5),
                random.nextFloatBetween(-2.5, 5),
                random.nextFloatBetween(-7.5, 7.5)
            );

            const color = createRandomColor(random, 0.5, 1, 1);

            world.createEntity<[MeshComponent, TransformComponent]>(
                {
                    componentId: "mesh",
                    material: {
                        color,
                        topology: "triangle-list",
                    },
                    vertices: { type: "Number", array },
                },
                { componentId: "transform", local }
            );
        }
    } else {
        const query = world.queryEntities<[MeshComponent]>(["mesh"]);

        let i = newCount;

        for (const entry of query) {
            if (i < count) {
                world.destroyEntity(entry.entity);
                i += 1;
            }
        }
    }

    appContext.count = newCount;
}

function beginFrameSystem(world: World, part: WebGpuTestAppPart, context: AppContextGPU): void {
    context.beginFrame();

    const [width, height] = context.getSize(true);

    const rotation = parseInt(part.inputRotation.getValue());

    const d = (rotation * Math.PI) / 180;

    const model = Matrix4x4.identity;
    model.rotateYAnglePre(d);

    const view = Matrix4x4.identity;
    view.rotateXAnglePre(0.5);
    view.translatePre(0, 0, -15);

    let projection;

    if (part.inputProjection.getValue() === "orthographic") {
        projection = Matrix4x4.fromOrthographic(-10, 10, 10, -10, 1, 2000);
    } else {
        projection = Matrix4x4.fromPerspectiveFrustum(65, width / height, 1, 2000);
    }

    projection.translatePre(0, 0, 1);
    projection.scalePre(1, 1, 0.5);

    const data = world.readData<GPUData>("gpuData");

    data.currentTextureView = context.currentTextureView;
    data.mvpMatrix = projection.mul(view).mul(model);
}
