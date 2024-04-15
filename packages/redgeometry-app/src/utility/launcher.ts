import { throwError } from "redgeometry/src/utility/debug";
import { AppLauncherModule } from "../ecs-modules/app-launcher.js";
import { App, type AppContext, type WorldGroupOptions } from "../ecs/app.js";
import type { DefaultWorldScheduleId, WorldId } from "../ecs/types.js";

export type AppPartId = string;

export type AppLauncherPartOptions = {
    id: AppPartId;
    runWorldId: WorldId;
    runScheduleId: DefaultWorldScheduleId;
};

type AppLauncherPartOptionsEntry = {
    partOptions: AppLauncherPartOptions;
    worldGroupOptions: WorldGroupOptions[];
};

export class AppLauncher {
    private context: AppContext;
    private entriesByParts: Map<AppPartId, AppLauncherPartOptionsEntry>;
    private entriesByWorldGroups: Map<WorldId, AppLauncherPartOptionsEntry>;

    constructor(context: AppContext) {
        this.context = context;

        this.entriesByParts = new Map();
        this.entriesByWorldGroups = new Map();
    }

    public addPart(partOptions: AppLauncherPartOptions, ...worldGroupOptions: WorldGroupOptions[]): void {
        const appPartId = partOptions.id;

        const entry: AppLauncherPartOptionsEntry = { partOptions, worldGroupOptions };

        this.entriesByParts.set(appPartId, entry);

        for (const wgo of worldGroupOptions) {
            if (this.entriesByWorldGroups.has(wgo.id)) {
                throwError("Duplicate world group id '{}' found", wgo.id, wgo.id);
            }

            this.entriesByWorldGroups.set(wgo.id, entry);
        }
    }

    public run(defaultAppPartId: AppPartId): void {
        const entry = this.getEntry(defaultAppPartId);
        const app = new App(this.context);

        const appPartIds = [...this.entriesByParts.keys()];

        for (const wgo of entry.worldGroupOptions) {
            if (wgo.parent === undefined) {
                // Inject app launcher module
                for (const world of wgo.worlds) {
                    const appLauncherModule = new AppLauncherModule(appPartIds, entry.partOptions.id);

                    world.modules.push(appLauncherModule);
                }
            }

            app.addWorldGroup(wgo);
        }

        app.run(entry.partOptions.runWorldId, entry.partOptions.runScheduleId);
    }

    private getEntry(defaultAppPartId: AppPartId): AppLauncherPartOptionsEntry {
        if (this.context.isMain) {
            const params = new URLSearchParams(window.location.search);
            const appPartId = params.get("app") ?? defaultAppPartId;

            let entry = this.entriesByParts.get(appPartId);

            if (entry === undefined) {
                // Fall back to default app part
                entry = this.entriesByParts.get(defaultAppPartId);

                if (entry === undefined) {
                    throwError("Default app part '{}' not found", defaultAppPartId);
                }
            }

            return entry;
        } else {
            const worldGroupid = this.context.selfName;

            if (worldGroupid === undefined) {
                throwError("error", defaultAppPartId);
            }

            const entry = this.entriesByWorldGroups.get(worldGroupid);

            if (entry === undefined) {
                throwError("Entry '{}' not found", worldGroupid);
            }

            return entry;
        }
    }
}
