import {
    ChangeFlags,
    Component,
    ComponentIdOf,
    Components,
    ComponentsIdsOf,
    EntityEntry,
    TypedComponent,
    TypedComponents,
    TypedEntityEntry,
} from "./types";

/**
 * Helper function to validate component types.
 */
export function hasComponentTypes<T extends Component[]>(
    components: Components,
    types: ComponentsIdsOf<T>
): components is TypedComponents<T> {
    return types.every((t) => t in components);
}

/**
 * Helper function to validate component types.
 */
export function hasComponent<T extends Component>(
    components: Components,
    componentId: ComponentIdOf<T>
): components is TypedComponent<T> {
    return componentId in components;
}

export function hasTypedComponents<T extends Component[]>(
    entry: EntityEntry,
    componentIds: ComponentsIdsOf<T>
): entry is TypedEntityEntry<T, Component[]> {
    return componentIds.every((t) => t in entry.components);
}

export function hasTypedChangeset<T extends Component[]>(
    entry: EntityEntry,
    componentIds: ComponentsIdsOf<T>
): entry is TypedEntityEntry<Component[], T> {
    return componentIds.every((t) => t in entry.changeset);
}

export function hasChangeFlag(value: number, flag: ChangeFlags): boolean {
    return (value & flag) === flag;
}
