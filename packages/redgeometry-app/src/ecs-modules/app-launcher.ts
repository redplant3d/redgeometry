import type { WorldModule } from "../ecs/types.js";
import type { World } from "../ecs/world.js";

export type AppLauncherData = {
    dataId: "app-launcher";
    appPartId: string;
    appPartIds: string[];
};

export class AppLauncherModule implements WorldModule {
    public readonly moduleId = "app-launcher";

    private appPartIds: string[];
    private appPartId: string;

    constructor(appPartIds: string[], appPartId: string) {
        this.appPartIds = appPartIds;
        this.appPartId = appPartId;
    }

    public setup(world: World): void {
        world.registerData<AppLauncherData>("app-launcher");

        world.writeData<AppLauncherData>({
            dataId: "app-launcher",
            appPartIds: this.appPartIds,
            appPartId: this.appPartId,
        });
    }
}
