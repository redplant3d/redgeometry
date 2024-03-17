import type { SerializationMap } from "../internal/serialize.js";
import { throwError } from "../utility/debug.js";
import type { Component, ComponentId, ComponentIdOf, ComponentIdsOf, EntityId } from "./types.js";
import { ChangeFlags } from "./world.js";

type EntityEntry = {
    entityId: EntityId;
    parent: EntityId | undefined;
    children: Set<EntityId> | undefined;
    depth: number;
};

type ComponentEntry = {
    componendId: ComponentId;
    components: Map<EntityId, Component>;
    changeFlags: Map<EntityId, ChangeFlags>;
};

export class EntityComponentStorage {
    private entityId: number;

    public componentEntries: Map<ComponentId, ComponentEntry>;
    public entitiesChanged: Set<EntityId>;
    public entityEntries: Map<EntityId, EntityEntry>;

    constructor() {
        this.entityEntries = new Map();
        this.componentEntries = new Map();

        this.entitiesChanged = new Set();

        this.entityId = 0;
    }

    public cleanup(): void {
        for (const componentEntry of this.componentEntries.values()) {
            componentEntry.changeFlags.clear();
        }

        this.entitiesChanged.clear();
    }

    public clear(): void {
        this.entityEntries.clear();
        this.componentEntries.clear();

        this.entitiesChanged.clear();

        this.entityId = 0;
    }

    public createEntity<T extends Component[]>(parent: EntityId | undefined, components: T): EntityId {
        const entityId = this.createEntityId();

        let depth = 0;

        if (parent !== undefined) {
            const parentEntry = this.getEntityEntryOrThrow(parent);

            if (parentEntry.children === undefined) {
                parentEntry.children = new Set();
            }

            parentEntry.children.add(entityId);

            depth = parentEntry.depth + 1;
        }

        const entry: EntityEntry = {
            entityId,
            parent,
            children: undefined,
            depth,
        };

        for (const component of components) {
            const componentEntry = this.getComponentEntry(component.componentId);

            createComponent(componentEntry, entityId, component);
        }

        this.entityEntries.set(entityId, entry);
        this.entitiesChanged.add(entityId);

        return entityId;
    }

    public createHierarchySelector(): EntityHierarchySelector {
        return new EntityHierarchySelector(this.entityEntries);
    }

    public deleteComponent(entityId: EntityId, componentId: ComponentId): boolean {
        const componentEntry = this.getComponentEntryOrThrow(componentId);

        return deleteComponent(componentEntry, entityId);
    }

    public destroyEntity(entityId: EntityId): boolean {
        const entry = this.getEntityEntryOrThrow(entityId);

        // Delete components
        for (const componentEntry of this.componentEntries.values()) {
            deleteComponent(componentEntry, entityId);
        }

        // Remove from parent
        if (entry.parent !== undefined) {
            const parentEntry = this.getEntityEntryOrThrow(entry.parent);

            if (parentEntry.children !== undefined) {
                parentEntry.children.delete(entityId);
            }
        }

        // Destroy children
        if (entry.children !== undefined) {
            for (const childEntityId of entry.children) {
                this.destroyEntity(childEntityId);
            }
        }

        this.entityEntries.delete(entityId);
        this.entitiesChanged.add(entityId);

        return true;
    }

    public getComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        const componentEntry = this.componentEntries.get(componentId);

        if (componentEntry === undefined) {
            return undefined;
        }

        return componentEntry.components.get(entityId) as T | undefined;
    }

    public getEntitiesChanged(): IterableIterator<EntityId> {
        return this.entitiesChanged.values();
    }

    public hasChangeFlag<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flag: ChangeFlags,
    ): boolean {
        const componentEntry = this.getComponentEntryOrThrow(componentId);
        const changeFlag = componentEntry.changeFlags.get(entityId);

        if (changeFlag === undefined) {
            return false;
        }

        return (changeFlag & flag) === flag;
    }

    public hasComponent(entityId: EntityId, componentId: ComponentId): boolean {
        const componentEntry = this.getComponentEntryOrThrow(componentId);

        return componentEntry.components.has(entityId);
    }

    public loadEntities(serializationMap: SerializationMap, text: string): void {
        this.clear();

        const data = serializationMap.deserialize(text) as {
            entityEntries: EntityEntry[];
            componentEntries: ComponentEntry[];
        };

        for (const entry of data.entityEntries) {
            this.entityEntries.set(entry.entityId, entry);
        }

        for (const entry of data.componentEntries) {
            this.componentEntries.set(entry.componendId, entry);
        }
    }

    public queryEntities<T extends Component[]>(componentIds: ComponentIdsOf<T>): EntityComponentIterator {
        const componentEntries: ComponentEntry[] = [];

        for (const componentId of componentIds) {
            const componentEntry = this.getComponentEntryOrThrow(componentId);
            componentEntries.push(componentEntry);
        }

        return new EntityComponentIterator(this.entityEntries.values(), componentEntries);
    }

    public saveEntities(serializationMap: SerializationMap): string {
        return serializationMap.serialize({
            entityEntries: [...this.entityEntries.values()],
            componentEntries: [...this.componentEntries.values()],
        });
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        const componentEntry = this.getComponentEntry(component.componentId);
        componentEntry.components.set(entityId, component);

        updateComponent(componentEntry, entityId);

        this.entitiesChanged.add(entityId);
    }

    public setParent(entity: EntityId, parent: EntityId): void {
        const childEntry = this.getEntityEntryOrThrow(entity);

        // Update old parent's childs if nessecary
        if (childEntry.parent !== undefined) {
            const oldParentEntry = this.getEntityEntryOrThrow(childEntry.parent);

            if (oldParentEntry.children !== undefined) {
                oldParentEntry.children.delete(entity);
            }
        }

        const parentEntry = this.getEntityEntryOrThrow(parent);

        // Set new parent's child
        if (parentEntry.children === undefined) {
            parentEntry.children = new Set();
        }

        parentEntry.children.add(entity);

        // Set new parent
        childEntry.parent = parentEntry.entityId;

        // Update recursively
        this.updateHierarchy(childEntry, parentEntry.depth);
    }

    public updateComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        const componentEntry = this.getComponentEntry(componentId);

        updateComponent(componentEntry, entityId);

        this.entitiesChanged.add(entityId);
    }

    private createEntityId(): EntityId {
        const entityId = this.entityId;

        this.entityId += 1;

        return entityId as EntityId;
    }

    private getComponentEntry(componendId: ComponentId): ComponentEntry {
        let entry = this.componentEntries.get(componendId);

        if (entry === undefined) {
            // Create new entry
            entry = {
                componendId,
                components: new Map(),
                changeFlags: new Map(),
            };

            this.componentEntries.set(componendId, entry);
        }

        return entry;
    }

    private getComponentEntryOrThrow(componendId: ComponentId): ComponentEntry {
        const entry = this.componentEntries.get(componendId);

        if (entry === undefined) {
            throwError("Componend id '{}' not found", componendId);
        }

        return entry;
    }

    private getEntityEntryOrThrow(entityId: EntityId): EntityEntry {
        const entry = this.entityEntries.get(entityId);

        if (entry === undefined) {
            throwError("Entity id '{}'not found", entityId);
        }

        return entry;
    }

    private updateHierarchy(entityEntry: EntityEntry, parentDepth: number): void {
        entityEntry.depth = parentDepth + 1;

        this.entitiesChanged.add(entityEntry.entityId);

        if (entityEntry.children === undefined) {
            return;
        }

        for (const childEntryId of entityEntry.children) {
            const childEntry = this.getEntityEntryOrThrow(childEntryId);

            this.updateHierarchy(childEntry, entityEntry.depth);
        }
    }
}

export class EntityComponentIterator {
    private entityEntry: EntityEntry | undefined;

    public componentEntries: ComponentEntry[];
    public entityEntries: IterableIterator<EntityEntry>;

    public constructor(entityEntries: IterableIterator<EntityEntry>, componentEntries: ComponentEntry[]) {
        this.entityEntries = entityEntries;
        this.componentEntries = componentEntries;
        this.entityEntry = undefined;
    }

    public getEntityId(): EntityId {
        const entityEntry = this.entityEntry;

        if (entityEntry === undefined) {
            throwError("Invalid entity entry");
        }

        return entityEntry.entityId;
    }

    public next(): boolean {
        for (const entityEntry of this.entityEntries) {
            if (this.hasEntity(entityEntry.entityId)) {
                this.entityEntry = entityEntry;
                return true;
            }
        }

        return false;
    }

    private hasEntity(entityId: EntityId): boolean {
        for (const entry of this.componentEntries) {
            if (!entry.components.has(entityId)) {
                return false;
            }
        }

        return true;
    }
}

export class EntityHierarchySelector {
    private entityEntries: Map<EntityId, EntityEntry>;
    private entry: EntityEntry | undefined;

    public constructor(entityEntries: Map<EntityId, EntityEntry>) {
        this.entityEntries = entityEntries;
        this.entry = undefined;
    }

    public getChildren(): IterableIterator<EntityId> | undefined {
        return this.entry?.children?.values();
    }

    public getDepth(): number {
        return this.entry?.depth ?? 0;
    }

    public getParent(): EntityId | undefined {
        return this.entry?.parent;
    }

    public select(entityId: EntityId): void {
        this.entry = this.entityEntries.get(entityId);
    }
}

function createComponent(componentEntry: ComponentEntry, entityId: EntityId, component: Component): void {
    componentEntry.components.set(entityId, component);
    componentEntry.changeFlags.set(entityId, ChangeFlags.Created | ChangeFlags.Updated);
}

function deleteComponent(componentEntry: ComponentEntry, entityId: EntityId): boolean {
    const success = componentEntry.components.delete(entityId);

    if (success) {
        componentEntry.changeFlags.set(entityId, ChangeFlags.Deleted);
    }

    return success;
}

function updateComponent(componentEntry: ComponentEntry, entityId: EntityId): void {
    let changeFlag = componentEntry.changeFlags.get(entityId);

    if (changeFlag !== undefined) {
        changeFlag |= ChangeFlags.Updated;
    } else {
        changeFlag = ChangeFlags.Updated;
    }

    componentEntry.changeFlags.set(entityId, changeFlag);
}
