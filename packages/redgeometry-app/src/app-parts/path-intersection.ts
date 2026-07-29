import { Path2 } from "redgeometry/src/core/path";
import { Bezier2Curve2 } from "redgeometry/src/primitives/bezier";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
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
import { RangeInputElement } from "../utility/html-element.ts";

type PathIntersectionInputData = {
    dataId: "path-intersection-input-data";
    inputParameter: RangeInputElement;
};

type PathIntersectionStateData = {
    dataId: "path-intersection-state-data";
    path: Path2;
    points: ReadonlyVector2[];
};

const PATH_INTERSECTION_START_SYSTEM_ID = "path-intersection-start-system";
const PATH_INTERSECTION_UPDATE_SYSTEM_ID = "path-intersection-update-system";
const PATH_INTERSECTION_RENDER_SYSTEM_ID = "path-intersection-render-system";

function pathIntersectionStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputParameter = new RangeInputElement("parameter", "0", "200", "100");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    world.setData<PathIntersectionInputData>({
        dataId: "path-intersection-input-data",
        inputParameter,
    });

    world.setData<PathIntersectionStateData>({
        dataId: "path-intersection-state-data",
        path: Path2.createEmpty(),
        points: [],
    });
}

function pathIntersectionUpdateSystem(world: World): void {
    const { inputParameter } = world.getData<PathIntersectionInputData>("path-intersection-input-data");
    const parameter = inputParameter.getInt();

    const c1 = new Bezier2Curve2(new Vector2(100, 150), new Vector2(300, 400), new Vector2(600, 250));
    const c2 = new Bezier2Curve2(new Vector2(100, 500), new Vector2(300, 100), new Vector2(500, 100 + 3 * parameter));

    const points: Vector2[] = [];
    const path = Path2.createEmpty();

    c1.intersectQuad(c2, points);

    path.addCurveSplines(c1);
    path.addCurveSplines(c2);

    world.setData<PathIntersectionStateData>({
        dataId: "path-intersection-state-data",
        path,
        points,
    });
}

function pathIntersectionRenderSystem(world: World): void {
    const { path, points } = world.getData<PathIntersectionStateData>("path-intersection-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.drawPath(path);
    ctx.fillPoints(points, "#FF0000", 5);
}

export const PATH_INTERSECTION_APP_PART_MODULE_ID = "path-intersection-app-part-module";

export function pathIntersectionAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PathIntersectionInputData>("path-intersection-input-data");
    context.addData<PathIntersectionStateData>("path-intersection-state-data");

    context.addSystem({
        id: PATH_INTERSECTION_START_SYSTEM_ID,
        fn: pathIntersectionStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: PATH_INTERSECTION_UPDATE_SYSTEM_ID,
        fn: pathIntersectionUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: PATH_INTERSECTION_RENDER_SYSTEM_ID,
        fn: pathIntersectionRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, PATH_INTERSECTION_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, PATH_INTERSECTION_UPDATE_SYSTEM_ID, PATH_INTERSECTION_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
