import { Edge2, Edge3, type ReadonlyEdge3 } from "redgeometry/src/primitives/edge";
import { Matrix4, type ReadonlyMatrix4 } from "redgeometry/src/primitives/matrix";
import { Quaternion, RotationOrder } from "redgeometry/src/primitives/quaternion";
import { Vector2, Vector3 } from "redgeometry/src/primitives/vector";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { APP_INPUT_START_SYSTEM_ID } from "../ecs-modules/app-input.ts";
import {
    APP_MODULE_ID,
    APP_START_SYSTEM_ID,
    APP_UPDATE_SYSTEM_ID,
    appModule,
    START_SCHEDULE_ID,
    UPDATE_SCHEDULE_ID,
    type AppInputData,
} from "../ecs-modules/app.ts";
import { WorldContext, type World } from "../ecs/world.ts";
import { ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../utility/html-element.ts";

type MatrixInputData = {
    dataId: "matrix-input-data";
    inputCount: TextBoxInputElement;
    inputProjection: ComboBoxInputElement;
    inputRotation: RangeInputElement;
};

type MatrixStateData = {
    dataId: "matrix-state-data";
    edges: Edge2[];
};

const MATRIX_START_SYSTEM_ID = "matrix-start-system";
const MATRIX_UPDATE_SYSTEM_ID = "matrix-update-system";
const MATRIX_RENDER_SYSTEM_ID = "matrix-render-system";

function matrixStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputCount = new TextBoxInputElement("count", "10");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    const inputRotation = new RangeInputElement("rotation", "0", "360", "0");
    inputRotation.setStyle("width: 200px");
    inputElements.push(inputRotation);

    const inputProjection = new ComboBoxInputElement("projection", "orthographic");
    inputProjection.setOptionValues("orthographic", "perspective");
    inputElements.push(inputProjection);

    world.setData<MatrixInputData>({
        dataId: "matrix-input-data",
        inputCount,
        inputRotation,
        inputProjection,
    });

    world.setData<MatrixStateData>({
        dataId: "matrix-state-data",
        edges: [],
    });
}

function matrixUpdateSystem(world: World): void {
    const { inputProjection, inputRotation } = world.getData<MatrixInputData>("matrix-input-data");

    const projection = inputProjection.getValue();
    const rotation = inputRotation.getFloat();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const [canvasWidth, canvasHeight] = ctx.getSize(true);

    const edges = createCube();

    // Projection
    const matProj = Matrix4.createIdentity();

    if (projection === "orthographic") {
        matProj.setFromOrthographicFrustum(-2.5, 2.5, -2.5, 2.5, 1, 10);
    } else {
        matProj.setFromPerspectiveFrustum(-0.5, 0.5, -0.5, 0.5, 1, 10);
    }

    // NDC to screen
    const w = 0.5 * canvasWidth;
    const h = 0.5 * canvasHeight;
    const s = 0.5 * Math.min(canvasWidth, canvasHeight);

    matProj.setScale(matProj, s, s, s);
    matProj.setTranslate(matProj, w, h, 0);

    // Model view
    const d = (rotation * Math.PI) / 180;
    const q = Quaternion.fromRotationEuler(1.1 * d, 1.3 * d, 1.7 * d, RotationOrder.XYZ);

    const matView = Matrix4.createIdentity();
    matView.setRotate(matView, q.a, q.b, q.c, q.d);
    matView.setTranslate(matView, 0, 0, -5);

    // View to screen coordinates
    matView.setMul(matProj, matView);

    world.setData<MatrixStateData>({
        dataId: "matrix-state-data",
        edges: transformEdges(edges, matView),
    });
}

function matrixRenderSystem(world: World): void {
    const { edges } = world.getData<MatrixStateData>("matrix-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.drawEdges(edges, "#000000");
}

function createCube(): Edge3[] {
    const p0 = new Vector3(1, 1, 1);
    const p1 = new Vector3(1, 1, -1);
    const p2 = new Vector3(1, -1, 1);
    const p3 = new Vector3(1, -1, -1);
    const p4 = new Vector3(-1, 1, 1);
    const p5 = new Vector3(-1, 1, -1);
    const p6 = new Vector3(-1, -1, 1);
    const p7 = new Vector3(-1, -1, -1);

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

function transformEdges(edges: ReadonlyEdge3[], mat: ReadonlyMatrix4): Edge2[] {
    const output: Edge2[] = [];

    for (const e of edges) {
        const p0 = mat.transformPoint(e.p0);
        const p1 = mat.transformPoint(e.p1);
        const pp0 = Vector2.fromObject(p0);
        const pp1 = Vector2.fromObject(p1);
        output.push(new Edge2(pp0, pp1));
    }

    return output;
}

export const MATRIX_APP_PART_MODULE_ID = "matrix-app-part-module";

export function matrixAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<MatrixInputData>("matrix-input-data");
    context.addData<MatrixStateData>("matrix-state-data");

    context.addSystem({
        id: MATRIX_START_SYSTEM_ID,
        fn: matrixStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: MATRIX_UPDATE_SYSTEM_ID,
        fn: matrixUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: MATRIX_RENDER_SYSTEM_ID,
        fn: matrixRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, MATRIX_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, MATRIX_UPDATE_SYSTEM_ID, MATRIX_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
