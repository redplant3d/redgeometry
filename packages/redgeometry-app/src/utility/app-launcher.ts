import { START_SCHEDULE_ID, STOP_SCHEDULE_ID, UPDATE_SCHEDULE_ID, type AppLauncherData } from "../ecs-modules/app.ts";
import type { AnimationFrameEvent } from "../ecs-modules/time.ts";
import { WorldStorage, type WorldModuleOptions } from "../ecs/world.js";

export type AppPartId = string;

export class AppLauncher {
    private appParts: Set<AppPartId>;
    private worldStorage: WorldStorage;

    public constructor() {
        this.appParts = new Set();
        this.worldStorage = new WorldStorage();
    }

    public addPart(worldId: AppPartId, options: WorldModuleOptions): void {
        this.appParts.add(worldId);
        this.worldStorage.add(worldId, options);
    }

    public async runPart(defaultAppPartId: AppPartId): Promise<void> {
        // Collect app part ids
        const appPartIds = this.appParts.values().toArray();

        // Get app part id to run
        const params = new URLSearchParams(window.location.search);
        const appPartId = params.get("app") ?? defaultAppPartId;

        // Get world and inject data
        const world = this.worldStorage.get(appPartId);
        world.setData<AppLauncherData>({
            dataId: "app-launcher-data",
            appPartIds,
            appPartId,
            requestExit: false,
        });

        let exitRequested = false;

        await world.runSchedule(START_SCHEDULE_ID);

        while (!exitRequested) {
            const time = await new Promise(requestAnimationFrame);

            world.addEvent<AnimationFrameEvent>({ eventId: "animation-frame-event", time });

            await world.runSchedule(UPDATE_SCHEDULE_ID);

            world.reset();

            const appLauncherData = world.getData<AppLauncherData>("app-launcher-data");

            if (appLauncherData.requestExit) {
                exitRequested = true;
            }
        }

        await world.runSchedule(STOP_SCHEDULE_ID);
    }
}
