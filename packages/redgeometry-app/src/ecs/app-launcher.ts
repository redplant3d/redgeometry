import type { WorldModule } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";

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
