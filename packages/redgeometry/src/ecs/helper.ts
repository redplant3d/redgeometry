import {
    ChangeFlags,
    type Component,
    type ComponentIdOf,
    type Components,
    type ComponentsIdsOf,
    type EntityEntry,
    type TypedComponent,
    type TypedComponents,
    type TypedEntityEntry,
} from "./types.js";

export function hasChangeFlag(value: number, flag: ChangeFlags): boolean {
    return (value & flag) === flag;
}

export function hasComponent<T extends Component>(
    components: Components,
    componentId: ComponentIdOf<T>,
): components is TypedComponent<T> {
    return componentId in components;
}

export function hasComponentTypes<T extends Component[]>(
    components: Components,
    types: ComponentsIdsOf<T>,
): components is TypedComponents<T> {
    return types.every((t) => t in components);
}

export function hasTypedChangeset<T extends Component[]>(
    entry: EntityEntry,
    componentIds: ComponentsIdsOf<T>,
): entry is TypedEntityEntry<Component[], T> {
    return componentIds.every((t) => t in entry.changeset);
}

export function hasTypedComponents<T extends Component[]>(
    entry: EntityEntry,
    componentIds: ComponentsIdsOf<T>,
): entry is TypedEntityEntry<T, Component[]> {
    return componentIds.every((t) => t in entry.components);
}
