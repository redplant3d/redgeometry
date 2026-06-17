import { throwError } from "redgeometry/src/utility/debug";
import { AppModule, type AppLauncherData } from "../ecs-modules/app.ts";
import type { AnimationFrameEvent } from "../ecs-modules/time.ts";
import type { DefaultWorldScheduleId, WorldModule } from "../ecs/types.ts";
import { World, WORLD_SCHEDULE_OPTIONS_DEFAULT } from "../ecs/world.ts";

export type AppPartId = string;

export class AppLauncher {
    private worldModuleMap: Map<AppPartId, WorldModule>;

    public constructor() {
        this.worldModuleMap = new Map();
    }

    public addPart(appPartId: AppPartId, worldModule: WorldModule): void {
        if (this.worldModuleMap.has(appPartId)) {
            throwError("App part id '{}' already exists", appPartId);
        }

        this.worldModuleMap.set(appPartId, worldModule);
    }

    public async run(defaultAppPartId: AppPartId): Promise<void> {
        // Collect app part ids
        const appPartIds = [...this.worldModuleMap.keys()];

        // Get app part id to run
        const params = new URLSearchParams(window.location.search);
        const appPartId = params.get("app") ?? defaultAppPartId;

        // Create and run world
        const module = this.worldModuleMap.get(appPartId);

        if (module === undefined) {
            throwError("App part  id'{}' not found", appPartId);
        }

        const world = new World();
        world.addModules([new AppModule(appPartIds, appPartId), module]);
        world.addSchedules(WORLD_SCHEDULE_OPTIONS_DEFAULT);
        world.init();

        let exitRequested = false;

        await world.runSchedule<DefaultWorldScheduleId>("start");

        while (!exitRequested) {
            const time = await new Promise(requestAnimationFrame);

            world.writeEvent<AnimationFrameEvent>({ eventId: "animation-frame-event", time });

            await world.runSchedule<DefaultWorldScheduleId>("update");

            const appLauncherData = world.readData<AppLauncherData>("app-launcher-data");

            if (appLauncherData.requestExit) {
                exitRequested = true;
            }
        }

        await world.runSchedule<DefaultWorldScheduleId>("stop");
    }
}
