import type { World, WorldContext } from "../ecs/world.ts";
import { APP_START_SYSTEM_ID, START_SCHEDULE_ID, STOP_SCHEDULE_ID, type AppInputData } from "./app.ts";

export const APP_INPUT_START_SYSTEM_ID = "app-input-start-system";
export const APP_INPUT_STOP_SYSTEM_ID = "app-input-stop-system";

export function appInputStartSystem(world: World): void {
    const { inputElements, paramsContainer } = world.getData<AppInputData>("app-input-data");

    for (const inputElement of inputElements) {
        inputElement.register(paramsContainer);
    }
}

export function appInputStopSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    for (const inputElement of inputElements) {
        inputElement.unregister();
    }
}

export const APP_INPUT_MODULE_ID = "app-input-module";

export function appInputModule(context: WorldContext): void {
    context.addSystem(START_SCHEDULE_ID, {
        type: "sync",
        id: APP_INPUT_START_SYSTEM_ID,
        fn: appInputStartSystem,
    });

    context.addSystem(STOP_SCHEDULE_ID, {
        type: "sync",
        id: APP_INPUT_STOP_SYSTEM_ID,
        fn: appInputStopSystem,
    });

    context.addSystemDepedency(START_SCHEDULE_ID, [
        { type: "system", id: APP_START_SYSTEM_ID },
        { type: "system", id: APP_INPUT_START_SYSTEM_ID },
    ]);

    context.requireData<AppInputData>("app-input-data");
}
