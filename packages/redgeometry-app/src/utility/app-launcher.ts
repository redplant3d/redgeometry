import { throwError } from "redgeometry/src/utility/debug";
import { AppLauncherModule } from "../ecs-modules/app-launcher.ts";
import type { DefaultWorldScheduleId } from "../ecs/types.ts";
import { World, type WorldOptions } from "../ecs/world.ts";

export type AppPartId = string;

export type AppPartEntry = {
    options: WorldOptions;
    startupScheduleId: DefaultWorldScheduleId;
};

export class AppLauncher {
    private optionsMap: Map<AppPartId, WorldOptions>;

    public constructor() {
        this.optionsMap = new Map();
    }

    public addPart(id: AppPartId, options: WorldOptions): void {
        if (this.optionsMap.has(id)) {
            throwError("App part id '{}' already exists", id);
        }

        this.optionsMap.set(id, options);
    }

    public run(defaultAppPartId: AppPartId): void {
        // Collect app part ids
        const appPartIds = [...this.optionsMap.keys()];

        // Get app part id to run
        const params = new URLSearchParams(window.location.search);
        const appPartId = params.get("app") ?? defaultAppPartId;

        // Create app launcher module
        const appLauncherModule = new AppLauncherModule(appPartIds, appPartId);

        // Get world options
        const options = this.optionsMap.get(appPartId);

        if (options === undefined) {
            throwError("App part  id'{}' not found", appPartId);
        }

        // Create and run world
        const world = new World();
        world.addModules([...options.modules, appLauncherModule]);
        world.addSchedules(options.schedules);
        world.init();

        void world.runSchedule(options.startupScheduleId);
    }
}
