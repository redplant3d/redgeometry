import { Edge2, Edge3 } from "redgeometry/src/primitives/edge";
import { Matrix4 } from "redgeometry/src/primitives/matrix";
import { Point2, Point3 } from "redgeometry/src/primitives/point";
import { Quaternion, RotationOrder } from "redgeometry/src/primitives/quaternion";
import type { AppContextPlugin } from "../ecs-modules/app-context.js";
import { AppContextModule } from "../ecs-modules/app-context.js";
import type { AppInputData } from "../ecs-modules/app-input.js";
import { ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../ecs-modules/app-input.js";
import { AppMainModule, AppRemoteModule } from "../ecs-modules/app.js";
import type { WorldOptions } from "../ecs/app.js";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.js";
import { DEFAULT_WORLD_SCHEDULES, type World } from "../ecs/world.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: TextBoxInputElement;
    inputProjection: ComboBoxInputElement;
    inputRotation: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    edges: Edge2[];
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
    projection: string;
    rotation: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputCount = new TextBoxInputElement("count", "10");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    const inputRotation = new RangeInputElement("rotation", "0", "360", "0");
    inputRotation.setStyle("width: 200px");
    inputElements.push(inputRotation);

    const inputProjection = new ComboBoxInputElement("projection", "orthographic");
    inputProjection.setOptionValues("orthographic", "perspective");
    inputElements.push(inputProjection);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
        inputRotation,
        inputProjection,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        edges: [],
    });
}

function writeStateSystem(world: World): void {
    const { inputCount, inputRotation, inputProjection } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: inputCount.getInt(),
        projection: inputProjection.getValue(),
        rotation: inputRotation.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { projection, rotation } = world.readData<AppPartStateData>("app-part-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const [canvasWidth, canvasHeight] = ctx.getSize(true);

    const edges = createCube();

    // Projection
    let matProj: Matrix4 | undefined;

    if (projection === "orthographic") {
        matProj = Matrix4.fromOrthographicFrustum(-2.5, 2.5, -2.5, 2.5, 1, 10);
    } else {
        matProj = Matrix4.fromPerspectiveFrustum(-0.5, 0.5, -0.5, 0.5, 1, 10);
    }

    // NDC to screen
    const w = 0.5 * canvasWidth;
    const h = 0.5 * canvasHeight;
    const s = 0.5 * Math.min(canvasWidth, canvasHeight);

    matProj.scale(s, s, s);
    matProj.translate(w, h, 0);

    // Model view
    const d = (rotation * Math.PI) / 180;
    const q = Quaternion.fromRotationEuler(1.1 * d, 1.3 * d, 1.7 * d, RotationOrder.XYZ);

    const matView = Matrix4.createIdentity();
    matView.rotate(q.a, q.b, q.c, q.d);
    matView.translate(0, 0, -5);

    // View to screen coordinates
    matView.mulSet(matProj, matView);

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        edges: transformEdges(edges, matView),
    });
}

function renderSystem(world: World): void {
    const { edges } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.drawEdges(edges, "#000000");
}

function createCube(): Edge3[] {
    const p0 = new Point3(1, 1, 1);
    const p1 = new Point3(1, 1, -1);
    const p2 = new Point3(1, -1, 1);
    const p3 = new Point3(1, -1, -1);
    const p4 = new Point3(-1, 1, 1);
    const p5 = new Point3(-1, 1, -1);
    const p6 = new Point3(-1, -1, 1);
    const p7 = new Point3(-1, -1, -1);

    const edges = [
        new Edge3(p0, p1),
        new Edge3(p2, p3),
        new Edge3(p4, p5),
        new Edge3(p6, p7),

        new Edge3(p0, p2),
        new Edge3(p1, p3),
        new Edge3(p4, p6),
        new Edge3(p5, p7),

        new Edge3(p0, p4),
        new Edge3(p1, p5),
        new Edge3(p2, p6),
        new Edge3(p3, p7),
    ];

    return edges;
}

function transformEdges(edges: Edge3[], m: Matrix4): Edge2[] {
    const output: Edge2[] = [];

    for (const e of edges) {
        const p0 = m.mulPt3(e.p0);
        const p1 = m.mulPt3(e.p1);
        const pp0 = Point2.from(p0);
        const pp1 = Point2.from(p1);
        output.push(new Edge2(pp0, pp1));
    }

    return output;
}

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "app-part-main";

    public setup(world: World): void {
        world.registerData<AppPartMainData>("app-part-main");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "app-part-remote";

    public setup(world: World): void {
        world.addModules([new AppContextModule()]);

        world.registerData<AppPartRemoteData>("app-part-remote");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

export const MATRIX_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const MATRIX_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};
