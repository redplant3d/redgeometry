import type { EntityId, WorldPlugin } from "../ecs/types.js";
import type { World } from "../ecs/world.js";

export type ParentComponent = {
    componentId: "parent";
    entity: EntityId;
};

export type ComputedChildrenComponent = {
    componentId: "computed-children";
    value: Set<EntityId>;
};

export function startHierarchySystem(world: World): void {
    const plugin = new HierarchyPlugin();
    plugin.initialize();
    world.setPlugin<HierarchyPlugin>(plugin);
}

export function hierarchySystem(world: World): void {
    const query = world.queryEntities<ParentComponent>((q) => q.isCreated("parent"));

    // Entries
    while (query.next()) {
        //
    }

    const query2 = world.queryEntities<ParentComponent>((q) => q.isUpdated("parent"));

    // Entries
    while (query2.next()) {
        //
    }
}

export class HierarchyPlugin implements WorldPlugin {
    public readonly pluginId = "hierarchy";

    public constructor() {}

    public initialize(): void {}
}
