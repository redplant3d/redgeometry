import { Path2 } from "redgeometry/src/core/path";
import { log } from "redgeometry/src/internal/log";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { type AppContextPlugin } from "../ecs-modules/app-context.ts";
import { APP_INPUT_START_SYSTEM_ID } from "../ecs-modules/app-input.ts";
import {
    APP_MODULE_ID,
    APP_START_SYSTEM_ID,
    APP_UPDATE_SYSTEM_ID,
    appModule,
    START_SCHEDULE_ID,
    UPDATE_SCHEDULE_ID,
    type AppInputData,
    type AppMainInputData,
} from "../ecs-modules/app.ts";
import type { TimeData } from "../ecs-modules/time.ts";
import { ComponentFlags, WorldContext, type World } from "../ecs/world.ts";
import { RangeInputElement } from "../utility/html-element.ts";

type EcsBounceInputData = {
    dataId: "ecs-bounce-input-data";
    inputCount: RangeInputElement;
};

type EcsBounceStateData = {
    dataId: "ecs-bounce-state-data";
    count: number;
    json: string | undefined;
    random: Random;
};

type CircleComponent = {
    componentId: "circle-component";
};

type RectangleComponent = {
    componentId: "rectangle-component";
};

type ObjectComponent = {
    componentId: "object-component";
    color: string;
    position: ReadonlyVector2;
    size: number;
    velocity: ReadonlyVector2;
};

const ECS_BOUNCE_START_SYSTEM_ID = "ecs-bounce-start-system";
const ECS_BOUNCE_SPAWN_SYSTEM_ID = "ecs-bounce-spawn-system";
const ECS_BOUNCE_MOVEMENT_SYSTEM_ID = "ecs-bounce-movement-system";
const ECS_BOUNCE_CLEAR_RENDER_SYSTEM_ID = "ecs-bounce-clear-render-system";
const ECS_BOUNCE_CIRCLE_RENDER_SYSTEM_ID = "ecs-bounce-circle-render-system";
const ECS_BOUNCE_RECTANGLE_RENDER_SYSTEM_ID = "ecs-bounce-rectangle-render-system";
const ECS_BOUNCE_NOTIFICATION_SYSTEM_ID = "ecs-bounce-notification-system";

function ecsBounceStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputCount = new RangeInputElement("count", "0", "1000", "10");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    world.setData<EcsBounceInputData>({
        dataId: "ecs-bounce-input-data",
        inputCount,
    });

    const { seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();

    world.setData<EcsBounceStateData>({
        dataId: "ecs-bounce-state-data",
        count: 0,
        json: undefined,
        random: RandomXSR128.fromSeedLcg(seed),
    });
}

function ecsBounceSpawnSystem(world: World): void {
    const appStateData = world.getData<EcsBounceStateData>("ecs-bounce-state-data");
    const appPartInputData = world.getData<EcsBounceInputData>("ecs-bounce-input-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const { random } = appStateData;

    const currCount = appStateData.count;
    const nextCount = appPartInputData.inputCount.getInt();

    if (currCount <= nextCount) {
        for (let i = currCount; i < nextCount; i++) {
            const shape = random.nextFloat() < 0.8 ? "rectangle-component" : "circle-component";
            const size = random.nextFloatBetween(10, 100);
            const color = random.nextFloat() < 0.5 ? "red" : "blue";
            const position = new Vector2(
                random.nextFloatBetween(0, ctx.canvas.width),
                random.nextFloatBetween(0, ctx.canvas.height),
            );
            const velocity = new Vector2(random.nextFloatBetween(-1, 1), random.nextFloatBetween(-1, 1));

            const entity = world.createEntity();
            world.addComponent<CircleComponent | RectangleComponent>(entity, {
                componentId: shape,
            });
            world.addComponent<ObjectComponent>(entity, {
                componentId: "object-component",
                size,
                color,
                position,
                velocity,
            });
        }
    } else {
        const query = world.queryEntities<ObjectComponent>((q) => q.hasComponent("object-component"));

        let i = nextCount;

        while (query.next()) {
            const entityId = query.getEntityId();

            if (i < currCount) {
                world.destroyEntity(entityId);
                i += 1;
            }
        }
    }

    appStateData.count = nextCount;
}

function ecsBounceMovementSystem(world: World): void {
    const { delta } = world.getData<TimeData>("time-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const { width, height } = ctx.canvas;

    const query = world.queryEntities<ObjectComponent>((q) => q.hasComponent("object-component"));

    while (query.next()) {
        const entityId = query.getEntityId();
        const object = query.getComponent<ObjectComponent>("object-component");

        const p = object.position;
        const v = object.velocity;
        const d = 0.5 * object.size;

        let vx = v.x;
        let vy = v.y;
        let px = p.x + delta * vx;
        let py = p.y + delta * vy;

        if (px > width - d) {
            px = width - d;
            vx = -vx;
        } else if (px < d) {
            px = d;
            vx = -vx;
        }

        if (py > height - d) {
            py = height - d;
            vy = -vy;
        } else if (py < d) {
            py = d;
            vy = -vy;
        }

        object.position = new Vector2(px, py);
        object.velocity = new Vector2(vx, vy);

        world.updateComponent<ObjectComponent>(entityId, "object-component");
    }
}

function ecsBounceClearRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
}

function ecsBounceCircleRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const query = world.queryEntities<CircleComponent | ObjectComponent>(
        (q) =>
            q.hasComponent<CircleComponent>("circle-component") && q.hasComponent<ObjectComponent>("object-component"),
    );

    const red = Path2.createEmpty();
    const blue = Path2.createEmpty();

    while (query.next()) {
        const object = query.getComponent<ObjectComponent>("object-component");

        const p = object.position;
        const d = object.size;
        const c = object.color;

        if (c === "red") {
            red.addCircle(p, 0.5 * d);
        } else if (c === "blue") {
            blue.addCircle(p, 0.5 * d);
        }
    }

    ctx.fillPath(red, "red");
    ctx.fillPath(blue, "blue");
}

function ecsBounceRectangleRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const query = world.queryEntities<RectangleComponent | ObjectComponent>(
        (q) =>
            q.hasComponent<RectangleComponent>("rectangle-component") &&
            q.hasComponent<ObjectComponent>("object-component"),
    );

    const red = Path2.createEmpty();
    const blue = Path2.createEmpty();

    while (query.next()) {
        const entityId = query.getEntityId();
        const object = world.findComponent<ObjectComponent>(entityId, "object-component");

        if (object === undefined) {
            continue;
        }

        const p = object.position;
        const d = object.size;
        const c = object.color;

        const x0 = p.x - 0.5 * d;
        const y0 = p.y - 0.5 * d;
        const x1 = p.x + 0.5 * d;
        const y1 = p.y + 0.5 * d;

        if (c === "red") {
            red.addRectXY(x0, y0, x1, y1);
        } else if (c === "blue") {
            blue.addRectXY(x0, y0, x1, y1);
        }
    }

    ctx.fillPath(red, "red");
    ctx.fillPath(blue, "blue");
}

function ecsBounceNotificationSystem(world: World): void {
    let createdCount = 0;
    let deletedCount = 0;

    const query = world.queryEntities(() => true);

    while (query.next()) {
        if (query.hasComponentFlags<ObjectComponent>("object-component", ComponentFlags.ADDED)) {
            createdCount += 1;
        }

        if (query.hasComponentFlags<ObjectComponent>("object-component", ComponentFlags.DELETED)) {
            deletedCount += 1;
        }
    }

    if (createdCount > 0 || deletedCount > 0) {
        log.info("created = {}, deleted = {}", createdCount, deletedCount);
    }
}

export function ecsBounceAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<EcsBounceInputData>("ecs-bounce-input-data");
    context.addData<EcsBounceStateData>("ecs-bounce-state-data");

    context.addSystem({
        id: ECS_BOUNCE_START_SYSTEM_ID,
        fn: ecsBounceStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: ECS_BOUNCE_SPAWN_SYSTEM_ID,
        fn: ecsBounceSpawnSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: ECS_BOUNCE_MOVEMENT_SYSTEM_ID,
        fn: ecsBounceMovementSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: ECS_BOUNCE_CLEAR_RENDER_SYSTEM_ID,
        fn: ecsBounceClearRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: ECS_BOUNCE_CIRCLE_RENDER_SYSTEM_ID,
        fn: ecsBounceCircleRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: ECS_BOUNCE_RECTANGLE_RENDER_SYSTEM_ID,
        fn: ecsBounceRectangleRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: ECS_BOUNCE_NOTIFICATION_SYSTEM_ID,
        fn: ecsBounceNotificationSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, ECS_BOUNCE_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, ECS_BOUNCE_SPAWN_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystemDepedency({
        seq: [ECS_BOUNCE_SPAWN_SYSTEM_ID, ECS_BOUNCE_MOVEMENT_SYSTEM_ID, ECS_BOUNCE_CLEAR_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystemDepedency({
        seq: [
            ECS_BOUNCE_CLEAR_RENDER_SYSTEM_ID,
            ECS_BOUNCE_RECTANGLE_RENDER_SYSTEM_ID,
            ECS_BOUNCE_CIRCLE_RENDER_SYSTEM_ID,
        ],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystemDepedency({
        seq: [ECS_BOUNCE_SPAWN_SYSTEM_ID, ECS_BOUNCE_NOTIFICATION_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
