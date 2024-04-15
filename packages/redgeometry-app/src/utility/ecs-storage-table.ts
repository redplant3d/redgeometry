import type { SerializationMap } from "redgeometry/src/internal/serialize";
import { assertDebug, throwError } from "redgeometry/src/utility/debug";
import { ObjectPool } from "redgeometry/src/utility/object";
import { Bitset } from "redgeometry/src/utility/set";
import type { Component, ComponentId, ComponentIdOf, ComponentIdsOf, EntityId } from "../ecs/types.js";
import { ChangeFlags } from "../ecs/world.js";

enum EntityChangeFlags {
    None,
    Created,
    Updated,
    Deleted,
}

type ComponentRef = number;
type EntityRef = number;
type ComponentEntityRef = number;
type ComponentTableEntryRef = number;
type ComponentTableRef = number;

function tableTypeCreateFn(): Bitset {
    return Bitset.fromCapacity(0);
}

function tableTypeClearFn(b: Bitset): void {
    b.reset();
}

export class EntityComponentStorage {
    private changeTick: number;

    public componentChangeEntries: ComponentChangeEntries;
    public componentEntries: ComponentEntries;
    public entityChangeEntries: EntityChangeEntries;
    public entityEntries: EntityEntries;

    constructor() {
        this.entityEntries = new EntityEntries();
        this.componentEntries = new ComponentEntries();
        this.componentChangeEntries = new ComponentChangeEntries();
        this.entityChangeEntries = new EntityChangeEntries();

        this.changeTick = 0;
    }

    public cleanup(): void {
        this.entityChangeEntries.clear();
        this.componentChangeEntries.clear();

        this.changeTick = (this.changeTick + 1) >>> 0;
    }

    public clear(): void {
        this.entityEntries.clear();
        this.entityChangeEntries.clear();
        this.componentEntries.clear();
        this.componentChangeEntries.clear();

        this.changeTick = 0;
    }

    public createEntity<T extends Component[]>(parent: EntityId | undefined, components: T): EntityId {
        const entityId = this.entityEntries.createEntityId();
        const componentTableRef = this.componentEntries.getTableRefOrCreate(components);
        const componentTable = this.componentEntries.tables[componentTableRef];
        const entityRef = componentTable.addEntity(
            entityId,
            parent,
            components,
            componentTableRef,
            this.entityEntries,
            this.componentChangeEntries,
            this.changeTick,
        );

        this.entityEntries.setRef(entityId, entityRef);

        return entityId;
    }

    public createHierarchySelector(): EntityHierarchySelector {
        return new EntityHierarchySelector(this.entityEntries);
    }

    public deleteComponent(_entityId: EntityId, _componentId: ComponentId): boolean {
        throwError("Not implemented");
    }

    public destroyEntity(entityId: EntityId): boolean {
        const entityRef = this.entityEntries.getRef(entityId);

        if (entityRef === undefined) {
            return false;
        }

        const componentTableRef = this.entityEntries.componentTableRefs[entityRef];
        const componentEntityRef = this.entityEntries.componentEntityRefs[entityRef];
        const table = this.componentEntries.tables[componentTableRef];

        table.swapRemove(componentEntityRef, this.entityEntries);

        this.entityEntries.swapRemove(entityId, entityRef, this.componentEntries);

        return true;
    }

    public getComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        const entityRef = this.entityEntries.getRefOrThrow(entityId);
        const componentTableRef = this.entityEntries.componentTableRefs[entityRef];
        const componentEntityRef = this.entityEntries.componentEntityRefs[entityRef];
        const table = this.componentEntries.tables[componentTableRef];
        const tableEntry = table.getEntry(componentId);

        if (tableEntry === undefined) {
            return undefined;
        }

        return tableEntry.components[componentEntityRef] as T;
    }

    public getEntitiesChanged(): IterableIterator<EntityId> {
        return this.entityChangeEntries.entityIds.values();
    }

    public hasChangeFlag<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flag: ChangeFlags,
    ): boolean {
        const entityRef = this.entityEntries.getRefOrThrow(entityId);
        const changeRefHead = this.entityEntries.getChangeRefHead(entityRef, this.changeTick);
        const componentRef = this.componentEntries.getComponentRef(componentId);
        const changeFlags = this.componentChangeEntries.find(changeRefHead, componentRef);

        return (changeFlags & flag) === flag;
    }

    public hasComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): boolean {
        const entityRef = this.entityEntries.getRefOrThrow(entityId);
        const componentTableRef = this.entityEntries.componentTableRefs[entityRef];
        const table = this.componentEntries.tables[componentTableRef];

        return table.hasEntry(componentId);
    }

    public loadEntities(_serializationMap: SerializationMap, _text: string): void {
        throwError("Not implemented");
    }

    public queryEntities<T extends Component[]>(componentIds: ComponentIdsOf<T>): EntityComponentIterator {
        const componentTables: ComponentTable[] = [];

        for (const table of this.componentEntries.tables) {
            let isValid = true;

            for (const componentId of componentIds) {
                if (!table.hasEntry(componentId)) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                componentTables.push(table);
            }
        }

        return new EntityComponentIterator(this.entityEntries, this.componentEntries, componentTables);
    }

    public saveEntities(_serializationMap: SerializationMap): string {
        throwError("Not implemented");
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        const entityRef = this.entityEntries.getRefOrThrow(entityId);
        const componentTableRef = this.entityEntries.componentTableRefs[entityRef];
        const componentEntityRef = this.entityEntries.componentEntityRefs[entityRef];
        const table = this.componentEntries.tables[componentTableRef];
        const tableEntry = table.getEntry(component.componentId);

        if (tableEntry === undefined) {
            return;
        }

        // Set component value
        tableEntry.components[componentEntityRef] = component;

        // Write component table changes
        tableEntry.update(
            componentEntityRef,
            this.entityEntries,
            entityRef,
            this.componentChangeEntries,
            this.changeTick,
        );

        // Write entity changes
        this.entityEntries.update(entityId, entityRef, this.entityChangeEntries, this.changeTick);
    }

    public setParent(entityId: EntityId, parentEntityId: EntityId): void {
        if (!this.entityEntries.isValidParent(entityId, parentEntityId)) {
            throwError("Parent '{}' must not be a child of entity '{}'", parentEntityId, entityId);
        }

        this.entityEntries.setParent(entityId, parentEntityId, this.changeTick);
    }

    public updateComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        const entityRef = this.entityEntries.getRefOrThrow(entityId);
        const componentTableRef = this.entityEntries.componentTableRefs[entityRef];
        const componentEntityRef = this.entityEntries.componentEntityRefs[entityRef];
        const table = this.componentEntries.tables[componentTableRef];
        const tableEntry = table.getEntry(componentId);

        if (tableEntry === undefined) {
            return;
        }

        // Write component table changes
        tableEntry.update(
            componentEntityRef,
            this.entityEntries,
            entityRef,
            this.componentChangeEntries,
            this.changeTick,
        );

        // Write entity changes
        this.entityEntries.update(entityId, entityRef, this.entityChangeEntries, this.changeTick);
    }
}

export class EntityComponentIterator {
    private componentEntries: ComponentEntries;
    private entityEntries: EntityEntries;
    private componentTables: ComponentTable[];

    private entityRefs: EntityRef[];

    private componentTable: ComponentTable | undefined;
    private entityRef: EntityRef;
    private componentEntityRef: ComponentEntityRef;
    private componentTableIdx: ComponentTableRef;

    public constructor(
        entityEntries: EntityEntries,
        componentEntries: ComponentEntries,
        componentTables: ComponentTable[],
    ) {
        this.entityEntries = entityEntries;
        this.componentEntries = componentEntries;
        this.componentTables = componentTables;

        this.entityRefs = [];
        this.componentTable = undefined;

        this.entityRef = -1;
        this.componentTableIdx = -1;
        this.componentEntityRef = -1;
    }

    public getEntityId(): EntityId {
        const entityRef = this.entityRef;

        if (entityRef < 0) {
            throwError("Invalid entity ref");
        }

        return this.entityEntries.entityIds[entityRef];
    }

    public hasComponent<T extends Component>(componentId: ComponentIdOf<T>): boolean {
        const componentTable = this.componentTable;

        if (componentTable === undefined) {
            throwError("Invalid component table");
        }

        return componentTable.hasEntry(componentId);
    }

    public getComponent<T extends Component>(componentId: ComponentIdOf<T>): T {
        const componentTable = this.componentTable;
        const componentEntityRef = this.componentEntityRef;

        if (componentTable === undefined) {
            throwError("Invalid component table");
        }

        return componentTable.getComponent(componentId, componentEntityRef) as T;
    }

    private setNextEntity(componentEntityRef: ComponentEntityRef): void {
        this.entityRef = this.entityRefs[componentEntityRef];
        this.componentEntityRef = componentEntityRef;
    }

    private setNextTable(componentTableIdx: number): void {
        const componentTable = this.componentTables[componentTableIdx];

        this.componentTable = componentTable;
        this.entityRefs = componentTable.entityRefs;
    }

    public next(): boolean {
        const componentEntityRef = this.componentEntityRef + 1;

        if (componentEntityRef < this.entityRefs.length) {
            this.setNextEntity(componentEntityRef);

            return true;
        }

        const componentTableIdx = this.componentTableIdx + 1;

        if (componentEntityRef < this.componentTables.length) {
            this.setNextTable(componentTableIdx);
            this.setNextEntity(0);

            return true;
        }

        return false;
    }
}

export class EntityHierarchySelector {
    private entityEntries: EntityEntries;
    private entryRef: EntityRef | undefined;

    public constructor(entityEntries: EntityEntries) {
        this.entityEntries = entityEntries;
        this.entryRef = undefined;
    }

    public getChildren(): IterableIterator<EntityId> | undefined {
        if (this.entryRef === undefined) {
            return undefined;
        }

        return this.entityEntries.childrenEntityIds[this.entryRef]?.values();
    }

    public getDepth(): number {
        if (this.entryRef === undefined) {
            return 0;
        }

        return this.entityEntries.depths[this.entryRef];
    }

    public getParent(): EntityId | undefined {
        if (this.entryRef === undefined) {
            return undefined;
        }

        return this.entityEntries.parentEntityIds[this.entryRef];
    }

    public select(entityId: EntityId): void {
        this.entryRef = this.entityEntries.getRef(entityId);
    }
}

class EntityEntries {
    private nextEntityId: number;
    private refs: Map<EntityId, EntityRef>;

    public changeFlags: EntityChangeFlags[];
    public changeTicks: number[];
    public childrenEntityIds: (Set<EntityId> | undefined)[];
    public componentChangeRefHeads: number[];
    public componentEntityRefs: ComponentEntityRef[];
    public componentTableRefs: ComponentTableRef[];
    public depths: number[];
    public entityIds: EntityId[];
    public parentEntityIds: (EntityId | undefined)[];

    constructor() {
        this.entityIds = [];
        this.componentTableRefs = [];
        this.componentEntityRefs = [];
        this.componentChangeRefHeads = [];
        this.changeTicks = [];
        this.changeFlags = [];
        this.parentEntityIds = [];
        this.childrenEntityIds = [];
        this.depths = [];

        this.refs = new Map();
        this.nextEntityId = 0;
    }

    public clear(): void {
        this.refs.clear();
        this.nextEntityId = 0;
    }

    public create(
        entityId: EntityId,
        componentTableRef: ComponentTableRef,
        componentEntityRef: ComponentEntityRef,
        componentChangeRefHead: number,
        parent: EntityId | undefined,
        changeTick: number,
    ): EntityRef {
        let depth = 0;

        if (parent !== undefined) {
            const parentEntryRef = this.getRefOrThrow(parent);

            let children = this.childrenEntityIds[parentEntryRef];

            if (children === undefined) {
                children = new Set();
                this.childrenEntityIds[parentEntryRef] = children;
            }

            children.add(entityId);

            depth = this.depths[parentEntryRef] + 1;
        }

        const nextRef = this.entityIds.length;

        this.entityIds.push(entityId);
        this.componentTableRefs.push(componentTableRef);
        this.componentEntityRefs.push(componentEntityRef);
        this.componentChangeRefHeads.push(componentChangeRefHead);
        this.changeTicks.push(changeTick);
        this.changeFlags.push(EntityChangeFlags.Created);
        this.parentEntityIds.push(parent);
        this.childrenEntityIds.push(undefined);
        this.depths.push(depth);

        return nextRef;
    }

    public createEntityId(): EntityId {
        const entityId = this.nextEntityId;

        // TODO: free list and versioning (upper 7/8 bits)
        this.nextEntityId += 1;

        return entityId as EntityId;
    }

    public getChangeRefHead(entityRef: EntityRef, changeTick: number): number {
        if (this.changeTicks[entityRef] !== changeTick) {
            return -1;
        }

        // Must be updated to a valid ref
        return this.componentChangeRefHeads[entityRef];
    }

    public getRef(entityId: EntityId): EntityRef | undefined {
        const ref = this.refs.get(entityId);

        if (ref === undefined || ref >= this.entityIds.length) {
            return undefined;
        }

        return ref;
    }

    public getRefOrThrow(entityId: EntityId): EntityRef {
        const ref = this.refs.get(entityId);

        if (ref === undefined || ref >= this.entityIds.length) {
            throwError("Entity '{}'not found", entityId);
        }

        return ref;
    }

    public isValidParent(entityId: EntityId, parentEntityId: EntityId): boolean {
        // Ensure `parentEntryRef` is not a child of `entityRef`
        let currEntityId: EntityId | undefined = parentEntityId;

        while (currEntityId !== undefined) {
            if (currEntityId === entityId) {
                return false;
            }

            // Iterate parents
            const currentEntryRef = this.getRefOrThrow(currEntityId);
            currEntityId = this.parentEntityIds[currentEntryRef];
        }

        return true;
    }

    public setParent(entityId: EntityId, parentEntityId: EntityId, changeTick: number): void {
        const entityRef = this.getRefOrThrow(entityId);
        const parentEntityRef = this.getRefOrThrow(parentEntityId);

        this.removeEntityFromParent(entityRef);
        this.addEntityToParent(entityRef, parentEntityRef);
        this.updateHierarchy(entityRef, parentEntityRef, changeTick);
    }

    public setRef(entityId: EntityId, entityRef: number): void {
        this.refs.set(entityId, entityRef);
    }

    public swapRemove(entityId: EntityId, entityRef: EntityRef, componentEntries: ComponentEntries): void {
        this.removeEntityFromParent(entityRef);

        this.refs.delete(entityId);

        const removeRef = entityRef;
        const swapRef = this.entityIds.length - 1;

        if (removeRef < swapRef) {
            this.changeFlags[removeRef] = this.changeFlags[swapRef];
            this.changeTicks[removeRef] = this.changeTicks[swapRef];
            this.childrenEntityIds[removeRef] = this.childrenEntityIds[swapRef];
            this.componentChangeRefHeads[removeRef] = this.componentChangeRefHeads[swapRef];
            this.componentEntityRefs[removeRef] = this.componentEntityRefs[swapRef];
            this.componentTableRefs[removeRef] = this.componentTableRefs[swapRef];
            this.depths[removeRef] = this.depths[swapRef];
            this.entityIds[removeRef] = this.entityIds[swapRef];
            this.parentEntityIds[removeRef] = this.parentEntityIds[swapRef];
        }

        this.changeFlags.pop();
        this.changeTicks.pop();
        this.childrenEntityIds.pop();
        this.componentChangeRefHeads.pop();
        this.componentEntityRefs.pop();
        this.componentTableRefs.pop();
        this.depths.pop();
        this.entityIds.pop();
        this.parentEntityIds.pop();

        if (removeRef < swapRef) {
            const swapComponentTableRef = this.componentTableRefs[entityRef];
            const swapComponentEntityRef = this.componentEntityRefs[entityRef];
            const swapEntityId = this.entityIds[entityRef];

            const table = componentEntries.tables[swapComponentTableRef];
            table.entityRefs[swapComponentEntityRef] = entityRef;

            this.refs.set(swapEntityId, entityRef);
        }

        // TODO: Recursive deletion of entities
    }

    public update(
        entityId: EntityId,
        entityRef: EntityRef,
        entityChangeEntries: EntityChangeEntries,
        changeTick: number,
    ): void {
        if (this.changeTicks[entityRef] !== changeTick) {
            this.changeTicks[entityRef] = changeTick;

            entityChangeEntries.update(entityId, entityRef);
        }

        this.changeFlags[entityRef] |= EntityChangeFlags.Updated;
    }

    private addEntityToParent(entityRef: EntityRef, parentEntityRef: EntityRef): void {
        // Set child
        let newChildrenEntityIds = this.childrenEntityIds[parentEntityRef];

        if (newChildrenEntityIds === undefined) {
            newChildrenEntityIds = new Set();
            this.childrenEntityIds[parentEntityRef] = newChildrenEntityIds;
        }

        const entityId = this.entityIds[entityRef];
        newChildrenEntityIds.add(entityId);

        // Set parent
        const parentEntityId = this.entityIds[parentEntityRef];
        this.parentEntityIds[entityRef] = parentEntityId;
    }

    private removeEntityFromParent(entityRef: EntityRef): void {
        const parentEntityId = this.parentEntityIds[entityRef];

        if (parentEntityId === undefined) {
            return;
        }

        const parentEntityRef = this.getRefOrThrow(parentEntityId);
        const childrenEntityIds = this.childrenEntityIds[parentEntityRef];

        if (childrenEntityIds !== undefined) {
            const entityId = this.entityIds[entityRef];
            childrenEntityIds.delete(entityId);
        }
    }

    private updateHierarchy(entityRef: EntityRef, parentEntityRef: EntityRef, changeTick: number): void {
        this.depths[entityRef] = this.depths[parentEntityRef] + 1;
        this.changeTicks[entityRef] = changeTick;
        this.changeFlags[entityRef] = EntityChangeFlags.Updated;

        const childrenEntityIds = this.childrenEntityIds[entityRef];

        if (childrenEntityIds === undefined) {
            return;
        }

        for (const childEntityId of childrenEntityIds) {
            const childEntityRef = this.getRefOrThrow(childEntityId);
            this.updateHierarchy(childEntityRef, entityRef, changeTick);
        }
    }
}

class ComponentEntries {
    private componentIds: Map<ComponentId, number>;
    private nextComponentRef: ComponentRef;
    private tableTypePool: ObjectPool<Bitset>;

    public tables: ComponentTable[];

    constructor() {
        this.tableTypePool = new ObjectPool(tableTypeCreateFn, tableTypeClearFn);
        this.tables = [];

        this.componentIds = new Map();
        this.nextComponentRef = 0;
    }

    public clear(): void {
        for (const table of this.tables) {
            table.entityRefs = [];
        }

        this.tables = [];

        this.componentIds.clear();
        this.nextComponentRef = 0;
    }

    public destroyEntity(_ref: ComponentEntityRef): boolean {
        return false;
    }

    public getComponentRef(componentId: ComponentId): ComponentRef {
        let ref = this.componentIds.get(componentId);

        if (ref === undefined) {
            ref = this.nextComponentRef;
            this.componentIds.set(componentId, ref);
            this.nextComponentRef += 1;
        }

        return ref;
    }

    public getTableRefOrCreate(components: Component[]): ComponentTableRef {
        const tableType = this.tableTypePool.rent();

        for (const component of components) {
            const componentRef = this.getComponentRef(component.componentId);
            tableType.set(componentRef);
        }

        let tableRef = -1;

        for (let i = 0; i < this.tables.length; i++) {
            if (this.tables[i].isType(tableType)) {
                tableRef = i;
                break;
            }
        }

        if (tableRef < 0) {
            // Copy and shrink table type
            const nextTableType = Bitset.from(tableType);

            tableRef = this.createComponentTable(nextTableType, components);
        }

        this.tableTypePool.return(tableType);

        return tableRef;
    }

    private createComponentTable(type: Bitset, components: Component[]): ComponentTableRef {
        const entryRefs = new Map<ComponentId, ComponentTableEntryRef>();
        const entries: ComponentTableEntry[] = [];

        for (let i = 0; i < components.length; i++) {
            const componentId = components[i].componentId;

            entryRefs.set(componentId, i);

            const componentRef = this.getComponentRef(componentId);
            const entry = new ComponentTableEntry(componentRef);
            entries.push(entry);
        }

        const ref = this.tables.length;

        const table = new ComponentTable(type, entryRefs, entries);

        this.tables.push(table);

        return ref;
    }
}

class ComponentTable {
    private entries: ComponentTableEntry[];
    private entryRefs: Map<ComponentId, ComponentTableEntryRef>;
    private type: Bitset;

    public entityRefs: number[];

    constructor(type: Bitset, entryRefs: Map<ComponentId, ComponentTableEntryRef>, entries: ComponentTableEntry[]) {
        this.type = type;
        this.entryRefs = entryRefs;
        this.entries = entries;

        this.entityRefs = [];
    }

    public addEntity(
        entityId: EntityId,
        parent: EntityId | undefined,
        components: Component[],
        componentTableRef: ComponentTableRef,
        entityEntries: EntityEntries,
        changeEntries: ComponentChangeEntries,
        changeTick: number,
    ): EntityRef {
        let changeRefHead = -1;

        for (const component of components) {
            const entry = this.getEntryOrThrow(component.componentId);
            const componentRef = entry.getComponentRef();
            const changeRef = changeEntries.create(changeRefHead, componentRef, ChangeFlags.Created);

            entry.create(component, changeTick, changeRef);

            changeRefHead = changeRef;
        }

        const componentEntityRef = this.entityRefs.length;

        const entityRef = entityEntries.create(
            entityId,
            componentTableRef,
            componentEntityRef,
            changeRefHead,
            parent,
            changeTick,
        );

        this.entityRefs.push(entityRef);

        return entityRef;
    }

    public getEntry(componentId: ComponentId): ComponentTableEntry | undefined {
        const entryRef = this.entryRefs.get(componentId);

        if (entryRef === undefined) {
            return undefined;
        }

        return this.entries[entryRef];
    }

    public getEntryOrThrow(componentId: ComponentId): ComponentTableEntry {
        const entryRef = this.entryRefs.get(componentId);

        if (entryRef === undefined) {
            throwError("Component id '{}' not found", componentId);
        }

        return this.entries[entryRef];
    }

    public getComponent(componentId: ComponentId, componentEntityRef: ComponentEntityRef): Component {
        const entryRef = this.entryRefs.get(componentId);
        assertDebug(entryRef !== undefined);
        return this.entries[entryRef].components[componentEntityRef];
    }

    public hasEntry(componentId: ComponentId): boolean {
        return this.entryRefs.has(componentId);
    }

    public isType(type: Bitset): boolean {
        return type.eq(this.type);
    }

    public swapRemove(componentEntityRef: ComponentEntityRef, entityEntries: EntityEntries): void {
        const removeRef = componentEntityRef;
        const swapRef = this.entityRefs.length - 1;

        for (const entry of this.entries) {
            if (removeRef < swapRef) {
                entry.changeRefs[removeRef] = entry.changeRefs[swapRef];
                entry.changeTicks[removeRef] = entry.changeTicks[swapRef];
                entry.components[removeRef] = entry.components[swapRef];
            }

            entry.changeRefs.pop();
            entry.changeTicks.pop();
            entry.components.pop();
        }

        if (removeRef < swapRef) {
            this.entityRefs[componentEntityRef] = this.entityRefs[swapRef];
        }

        this.entityRefs.pop();

        if (removeRef < swapRef) {
            // Update entity ref to component
            const swapEntityRef = this.entityRefs[componentEntityRef];
            entityEntries.componentEntityRefs[swapEntityRef] = componentEntityRef;
        }
    }
}

class ComponentTableEntry {
    private componentRef: ComponentRef;

    public changeRefs: number[];
    public changeTicks: number[];
    public components: Component[];

    constructor(componentRef: ComponentRef) {
        this.componentRef = componentRef;

        this.changeRefs = [];
        this.changeTicks = [];
        this.components = [];
    }

    public create(component: Component, changeTick: number, changeRef: number): void {
        this.components.push(component);
        this.changeTicks.push(changeTick);
        this.changeRefs.push(changeRef);
    }

    public getComponentRef(): number {
        return this.componentRef;
    }

    public update(
        componentEntityRef: ComponentEntityRef,
        entityEntries: EntityEntries,
        entityRef: EntityRef,
        changeEntries: ComponentChangeEntries,
        changeTick: number,
    ): void {
        if (this.changeTicks[componentEntityRef] !== changeTick) {
            const changeRefHead = entityEntries.getChangeRefHead(entityRef, changeTick);
            const changeRef = changeEntries.create(changeRefHead, this.componentRef, ChangeFlags.Updated);

            // Update for current table entry
            this.changeTicks[componentEntityRef] = changeTick;
            this.changeRefs[componentEntityRef] = changeRef;

            // Update entity change ref head
            entityEntries.componentChangeRefHeads[entityRef] = changeRef;
        } else {
            const changeRef = this.changeRefs[componentEntityRef];
            changeEntries.set(changeRef, ChangeFlags.Updated);
        }
    }
}

class ComponentChangeEntries {
    public changeFlags: number[];
    public componentRefs: number[];
    public nextEntryRefs: number[];

    constructor() {
        this.changeFlags = [];
        this.componentRefs = [];
        this.nextEntryRefs = [];
    }

    public clear(): void {
        this.changeFlags = [];
        this.componentRefs = [];
        this.nextEntryRefs = [];
    }

    public create(nextEntryRef: number, componentRef: ComponentRef, changeFlag: ChangeFlags): number {
        const nextRef = this.changeFlags.length;

        this.changeFlags.push(changeFlag);
        this.componentRefs.push(componentRef);
        this.nextEntryRefs.push(nextEntryRef);

        return nextRef;
    }

    public find(changeRefHead: number, componentRef: ComponentRef): ChangeFlags {
        // Change ref head might be `-1`
        let currRef = changeRefHead;

        while (currRef >= 0) {
            if (this.componentRefs[currRef] === componentRef) {
                return this.changeFlags[currRef];
            }

            currRef = this.nextEntryRefs[currRef];
        }

        return ChangeFlags.None;
    }

    public get(changeRef: number): ChangeFlags {
        return this.changeFlags[changeRef];
    }

    public getChain(firstChangeRef: number): ChangeFlags[] {
        const changeFlags = [];

        let currRef = firstChangeRef;

        while (currRef >= 0) {
            changeFlags.push(this.changeFlags[currRef]);

            currRef = this.nextEntryRefs[currRef];
        }

        return changeFlags;
    }

    public set(changeRef: number, changeFlag: ChangeFlags): void {
        this.changeFlags[changeRef] |= changeFlag;
    }

    public setAll(changeRef: number, changeFlag: ChangeFlags): void {
        this.changeFlags[changeRef] = changeFlag;
    }
}

class EntityChangeEntries {
    public entityIds: EntityId[];
    public entityRefs: EntityRef[];

    constructor() {
        this.entityIds = [];
        this.entityRefs = [];
    }

    public clear(): void {
        this.entityIds = [];
        this.entityRefs = [];
    }

    public update(entityId: EntityId, entityRef: EntityRef): void {
        this.entityIds.push(entityId);
        this.entityRefs.push(entityRef);
    }
}
