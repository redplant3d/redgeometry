import { log } from "redgeometry/src/internal/log";
import { RandomXSR128 } from "redgeometry/src/utility/random";
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
    type AppMainInputData,
} from "../ecs-modules/app.ts";
import { WorldContext, type World } from "../ecs/world.ts";
import { RangeInputElement } from "../utility/html-element.ts";

type PlaygroundInputData = {
    dataId: "playground-input-data";
    inputParam1: RangeInputElement;
    inputParam2: RangeInputElement;
};

type PlaygroundStateData = {
    dataId: "playground-state-data";
};

const PLAYGROUND_START_SYSTEM_ID = "playground-start-system";
const PLAYGROUND_UPDATE_SYSTEM_ID = "playground-update-system";
const PLAYGROUND_RENDER_SYSTEM_ID = "playground-render-system";

function playgroundStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputParam1 = new RangeInputElement("param1", "1", "100", "50");
    inputParam1.setStyle("width: 200px");
    inputElements.push(inputParam1);

    const inputParam2 = new RangeInputElement("param2", "1", "100", "50");
    inputParam2.setStyle("width: 200px");
    inputElements.push(inputParam2);

    world.setData<PlaygroundInputData>({
        dataId: "playground-input-data",
        inputParam1,
        inputParam2,
    });

    world.setData<PlaygroundStateData>({
        dataId: "playground-state-data",
    });
}

function playgroundUpdateSystem(world: World): void {
    const { inputParam1, inputParam2 } = world.getData<PlaygroundInputData>("playground-input-data");
    const param1 = inputParam1.getInt();
    const param2 = inputParam2.getInt();

    const { seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();

    const random = RandomXSR128.fromSeedLcg(seed);

    log.info("param1 = {}, param2 = {}, random = {}", param1, param2, random.nextInt());

    world.setData<PlaygroundStateData>({
        dataId: "playground-state-data",
    });
}

function playgroundRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
}

export const PLAYGROUND_APP_PART_MODULE_ID = "playground-app-part-module";

export function playgroundAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PlaygroundInputData>("playground-input-data");
    context.addData<PlaygroundStateData>("playground-state-data");

    context.addSystem({
        id: PLAYGROUND_START_SYSTEM_ID,
        fn: playgroundStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: PLAYGROUND_UPDATE_SYSTEM_ID,
        fn: playgroundUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: PLAYGROUND_RENDER_SYSTEM_ID,
        fn: playgroundRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, PLAYGROUND_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, PLAYGROUND_UPDATE_SYSTEM_ID, PLAYGROUND_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
