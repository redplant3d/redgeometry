import type { Nominal } from "redgeometry/src/utility/types";
import type { DefaultSystemStage, WorldModule, WorldPlugin } from "../ecs/types.js";
import type { World } from "../ecs/world.js";
import type { Material } from "./material.js";
import type { Mesh } from "./mesh.js";

export type AssetId<T> = Nominal<number, "AssetId" & T>;

export function startAssetSystem(world: World): void {
    const assetPlugin = new AssetPlugin();
    world.setPlugin<AssetPlugin>(assetPlugin);
}

export class AssetPlugin implements WorldPlugin {
    public readonly pluginId = "asset";

    public readonly meshes: AssetCollection<Mesh>;
    public readonly materials: AssetCollection<Material>;

    constructor() {
        this.meshes = new AssetCollection();
        this.materials = new AssetCollection();
    }
}

export class AssetCollection<T> {
    private id: number;

    public entries: Map<AssetId<T>, T>;

    constructor() {
        this.entries = new Map();
        this.id = 0;
    }

    public add(data: T): AssetId<T> {
        const handle = this.createNewId();
        this.entries.set(handle, data);
        return handle;
    }

    public remove(handle: AssetId<T>): boolean {
        return this.entries.delete(handle);
    }

    private createNewId(): AssetId<T> {
        // TODO: Proper generation
        const handle = this.id;
        this.id += +1;
        return handle as AssetId<T>;
    }
}

export class AssetModule implements WorldModule {
    public readonly moduleId = "asset";

    public setup(world: World): void {
        world.registerPlugin<AssetPlugin>("asset");

        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: startAssetSystem });
    }
}
