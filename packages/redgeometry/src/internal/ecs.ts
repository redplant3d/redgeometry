import {
    ChangeFlags,
    Changeset,
    Component,
    ComponentId,
    Components,
    ComponentsIdsOf,
    EntityEntry,
    EntityId,
    hasTypedChangeset,
    hasTypedComponents,
    System,
    TypedEntityEntry,
} from "../ecs";

/**
 * Entry of a system with its entities and dependencies.
 */
export type SystemEntry = {
    fn: System;
    args?: unknown[] | undefined;
};

export class EntityEntryIterator<T extends Component[]> implements IterableIterator<TypedEntityEntry<T, Component[]>> {
    public iterator: IterableIterator<EntityEntry>;
    public componentIds: ComponentsIdsOf<T>;

    constructor(map: Map<EntityId, EntityEntry>, componentIds: ComponentsIdsOf<T>) {
        this.iterator = map.values();
        this.componentIds = componentIds;
    }

    public [Symbol.iterator](): IterableIterator<TypedEntityEntry<T, Component[]>> {
        return this;
    }

    public next(): IteratorResult<TypedEntityEntry<T, Component[]>> {
        for (const entry of this.iterator) {
            if (hasTypedComponents(entry, this.componentIds)) {
                return { done: false, value: entry };
            }
        }

        return { done: true, value: undefined };
    }
}

export class EntityEntryChangedIterator<T extends Component[]>
    implements IterableIterator<TypedEntityEntry<Component[], T>>
{
    public iterator: IterableIterator<EntityEntry>;
    public componentIds: ComponentsIdsOf<T>;

    constructor(map: Map<EntityId, EntityEntry>, componentIds: ComponentsIdsOf<T>) {
        this.iterator = map.values();
        this.componentIds = componentIds;
    }

    public [Symbol.iterator](): IterableIterator<TypedEntityEntry<Component[], T>> {
        return this;
    }

    public next(): IteratorResult<TypedEntityEntry<Component[], T>> {
        for (const entry of this.iterator) {
            if (hasTypedChangeset(entry, this.componentIds)) {
                return { done: false, value: entry };
            }
        }

        return { done: true, value: undefined };
    }
}

export function addComponent(components: Components, changeset: Changeset, component: Component): void {
    const compId = component.componentId;
    components[compId] = component;

    const changeFlags = changeset[compId] as ChangeFlags | undefined;

    if (changeFlags !== undefined) {
        changeset[compId] = changeFlags | ChangeFlags.Updated;
    } else {
        changeset[compId] = ChangeFlags.Created | ChangeFlags.Updated;
    }
}

export function createComponent(components: Components, changeset: Changeset, component: Component): void {
    const compId = component.componentId;
    components[compId] = component;
    changeset[compId] = ChangeFlags.Created | ChangeFlags.Updated;
}

export function deleteComponent(changeset: Changeset, compId: ComponentId): void {
    changeset[compId] = ChangeFlags.Deleted;
}

export function updateComponent(changeset: Changeset, compId: ComponentId): void {
    const changeFlags = changeset[compId] as ChangeFlags | undefined;

    if (changeFlags !== undefined) {
        changeset[compId] = changeFlags | ChangeFlags.Updated;
    } else {
        changeset[compId] = ChangeFlags.Updated;
    }
}
