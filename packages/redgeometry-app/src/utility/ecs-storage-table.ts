import { assertDebug, assertUnreachable, throwError } from "redgeometry/src/utility/debug";
import type { Component, ComponentId, ComponentIdOf, EntityId } from "../ecs/types.js";

const EMPTY_COMPONENT: Component = { componentId: "" };
const EMPTY_MAP: Map<never, never> = new Map<never, never>();
const EMPTY_ARRAY: never[] = [];
const ENTITY_REF_MASK = 0x00ffffff;

export enum ComponentFlags {
    None = 0,
    Created = 1,
    Updated = 2,
    Deleted = 4,
}

export enum EntityFlags {
    None = 0,
    Created = 1,
    Destroyed = 2,
    Disabled = 4,
}

export interface EntityComponentQuery<T extends Component = Component> {
    hasComponent(componentId: ComponentIdOf<T>): boolean;
    hasComponentFlags(componentId: ComponentIdOf<T>, flags: ComponentFlags): boolean;
    hasEntityFlags(flags: EntityFlags): boolean;
    isChanged(componentId: ComponentIdOf<T>): boolean;
    isCreated(componentId: ComponentIdOf<T>): boolean;
    isDeleted(componentId: ComponentIdOf<T>): boolean;
    isEntityDestroyed(): boolean;
    isUpdated(componentId: ComponentIdOf<T>): boolean;
}

enum EntityTransitionType {
    Reset,
    Destroy,
    Disable,
    Enable,
}

enum ComponentTransitionType {
    Add,
    Set,
    Update,
    Delete,
}

enum StorageFlags {
    None = 0,
    Destroyed = 1,
}

type ComponentSetEntryRef = number;
type ComponentSetRef = number;
type ComponentSetStorageRef = number;
type ComponentTableRef = number;
type EntityRef = number;
type EntityVersion = number;

type ComponentSetShape = ReadonlyMap<ComponentId, ComponentFlags>;
type ComponentContainer = Component[];

type EntityTransition = {
    type: EntityTransitionType;
    state: ComponentSetState;
    hits: number;
};

type ComponentTransition = {
    type: ComponentTransitionType;
    state: ComponentSetState;
    id: ComponentId;
    hits: number;
};

export class EntityComponentStorage {
    public componenSets: ComponentSet[];
    public componentSetStates: ComponentSetState[];
    public componentSetStorages: ComponentSetStorage[];
    public entities: Entities;

    constructor() {
        const rootState = new ComponentSetState(EMPTY_MAP, EntityFlags.Created);
        const terminalStorage = new ComponentSetStorage(EMPTY_MAP, StorageFlags.Destroyed);

        this.componentSetStates = [rootState];
        this.componentSetStorages = [terminalStorage];
        this.componenSets = [];

        this.entities = new Entities();
    }

    public addComponent<T extends Component>(entityId: EntityId, component: T): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(
            currSet.state,
            component.componentId,
            ComponentTransitionType.Add,
        );
        const nextSet = this.findOrCreateSet(nextState);

        const storageRef = this.moveSetEntry(entityId, entityRef, currSet, nextState, nextSet);
        nextSet.storage.setComponent(storageRef, component);
    }

    public clear(prune: boolean): void {
        const rootState = new ComponentSetState(EMPTY_MAP, EntityFlags.Created);
        const terminalStorage = new ComponentSetStorage(EMPTY_MAP, StorageFlags.Destroyed);

        this.componentSetStates = [rootState];
        this.componentSetStorages = [terminalStorage];
        this.componenSets = [];

        this.entities.clear(prune);
    }

    public createEntity<T extends Component[]>(components: T): EntityId {
        const entityId = this.entities.createEntityId();

        let nextState = this.getRootState();

        for (const comp of components) {
            nextState = this.makeComponentTransition(nextState, comp.componentId, ComponentTransitionType.Add);
        }

        const nextSet = this.findOrCreateSet(nextState);
        const storageRef = this.createSetEntry(entityId, nextState, nextSet);

        nextSet.storage.setComponents(storageRef, components);

        return entityId;
    }

    public deleteComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(currSet.state, componentId, ComponentTransitionType.Delete);
        const nextSet = this.findOrCreateSet(nextState);

        this.moveSetEntryDeleteComponent(entityId, entityRef, currSet, nextState, nextSet);
    }

    public destroyEntity(entityId: EntityId): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeEntityTransition(currSet.state, EntityTransitionType.Destroy);
        const nextSet = this.findOrCreateSet(nextState);

        this.moveSetEntryDestroyEntity(entityId, entityRef, currSet, nextState, nextSet);
    }

    public disableEntity(entityId: EntityId): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeEntityTransition(currSet.state, EntityTransitionType.Disable);
        const nextSet = this.findOrCreateSet(nextState);

        this.updateSetEntry(entityRef, currSet, nextState, nextSet);
    }

    public enableEntity(entityId: EntityId): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeEntityTransition(currSet.state, EntityTransitionType.Enable);
        const nextSet = this.findOrCreateSet(nextState);

        this.updateSetEntry(entityRef, currSet, nextState, nextSet);
    }

    public getComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const setEntryRef = this.entities.componentSetEntryRefs[entityRef];

        return currSet.getComponent(componentId, setEntryRef);
    }

    public hasComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): boolean {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);

        return currSet.state.hasComponent(componentId);
    }

    public hasComponentFlags<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        changeFlag: ComponentFlags,
    ): boolean {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const set = this.getComponentSet(entityRef);

        return set.state.hasComponentFlags(componentId, changeFlag);
    }

    public hasEntityFlags(entityId: EntityId, flags: EntityFlags): boolean {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const set = this.getComponentSet(entityRef);

        return set.state.hasEntityFlags(flags);
    }

    public queryEntities<T extends Component>(
        match: (q: EntityComponentQuery<T>) => boolean,
    ): EntityComponentIterator<T> {
        // TODO:
        // - Store max length of component set at the time of the query
        // - Lazy evalation of query function
        const querySets: ComponentSet[] = [];

        for (const set of this.componenSets) {
            if (set.length === 0 || set.state.isDisabled()) {
                continue;
            }

            if (match(set.state)) {
                querySets.push(set);
            }
        }

        return new EntityComponentIterator<T>(querySets);
    }

    public reset(): void {
        this.resetComponentSets();

        // Reset component storage of destroyed entities
        const storage = this.getFinalStorage();

        if (storage.length > 0) {
            storage.clear();
        }
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(
            currSet.state,
            component.componentId,
            ComponentTransitionType.Set,
        );
        const nextSet = this.findOrCreateSet(nextState);

        const storageRef = this.moveSetEntry(entityId, entityRef, currSet, nextState, nextSet);
        nextSet.storage.setComponent(storageRef, component);
    }

    public updateComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(currSet.state, componentId, ComponentTransitionType.Update);
        const nextSet = this.findOrCreateSet(nextState);

        this.updateSetEntry(entityRef, currSet, nextState, nextSet);
    }

    private createSetEntry(
        entityId: EntityId,
        nextState: ComponentSetState,
        nextSet: ComponentSet,
    ): ComponentSetStorageRef {
        const storageRef = nextSet.storage.createEntry(entityId);
        const setEntryRef = nextSet.createEntry(entityId & ENTITY_REF_MASK, storageRef);

        this.entities.createEntry(entityId, nextState.setRef, setEntryRef);

        return storageRef;
    }

    private findOrCreateSet(state: ComponentSetState): ComponentSet {
        let setRef = state.setRef;

        if (setRef >= 0) {
            return this.componenSets[setRef];
        }

        setRef = this.componenSets.length;

        const storage = this.findOrCreateStorage(state);
        const set = new ComponentSet(state, storage);
        this.componenSets.push(set);

        state.setRef = setRef;

        return set;
    }

    private findOrCreateStorage(state: ComponentSetState): ComponentSetStorage {
        const compIds: ComponentId[] = [];

        for (const [key, value] of state.shape) {
            if (value !== ComponentFlags.Deleted) {
                compIds.push(key);
            }
        }

        let flags = StorageFlags.None;

        if (compIds.length === 0 && state.isEntityDestroyed()) {
            flags = StorageFlags.Destroyed;
        }

        for (const storage of this.componentSetStorages) {
            if (storage.isMatching(compIds, flags)) {
                return storage;
            }
        }

        const components = new Map();
        for (const compId of compIds) {
            components.set(compId, []);
        }

        const storage = new ComponentSetStorage(components, flags);
        this.componentSetStorages.push(storage);

        return storage;
    }

    private getComponentSet(entityRef: EntityRef): ComponentSet {
        const componentSetRef = this.entities.componentSetRefs[entityRef];
        return this.componenSets[componentSetRef];
    }

    private getFinalStorage(): ComponentSetStorage {
        return this.componentSetStorages[0];
    }

    private getRootState(): ComponentSetState {
        return this.componentSetStates[0];
    }

    private makeComponentTransition(
        state: ComponentSetState,
        componentId: ComponentId,
        type: ComponentTransitionType,
    ): ComponentSetState {
        for (const transition of state.componentTransitions) {
            if (transition.id === componentId && transition.type === type) {
                // Found cached transition
                transition.hits += 1;
                return transition.state;
            }
        }

        // New transition
        const nextMap = new Map(state.shape);

        switch (type) {
            case ComponentTransitionType.Add: {
                nextMap.set(componentId, ComponentFlags.Created | ComponentFlags.Updated);
                break;
            }
            case ComponentTransitionType.Set: {
                if (nextMap.has(componentId)) {
                    nextMap.set(componentId, ComponentFlags.Updated);
                } else {
                    nextMap.set(componentId, ComponentFlags.Created | ComponentFlags.Updated);
                }
                break;
            }
            case ComponentTransitionType.Update: {
                const flag = nextMap.get(componentId);
                if (flag === undefined) {
                    throwError("Unable to update component id '{}'", componentId);
                }
                nextMap.set(componentId, flag | ComponentFlags.Updated);
                break;
            }
            case ComponentTransitionType.Delete: {
                if (!nextMap.has(componentId)) {
                    throwError("Unable to delete component id '{}'", componentId);
                }
                nextMap.set(componentId, ComponentFlags.Deleted);
                break;
            }
            default: {
                assertUnreachable(type);
            }
        }

        for (let i = 0; i < this.componentSetStates.length; i++) {
            const currState = this.componentSetStates[i];
            if (currState.isMatching(nextMap, state.flags)) {
                // Create new transition edge
                state.createComponentTransition(type, currState, componentId);
                return currState;
            }
        }

        const nextState = new ComponentSetState(nextMap, state.flags);
        this.componentSetStates.push(nextState);
        state.createComponentTransition(type, nextState, componentId);
        return nextState;
    }

    private makeEntityTransition(state: ComponentSetState, type: EntityTransitionType): ComponentSetState {
        for (const transition of state.entityTransitions) {
            if (transition.type === type) {
                // Found cached transition
                transition.hits += 1;
                return transition.state;
            }
        }

        // New transition
        let nextShape = state.shape;
        let nextFlags = state.flags;

        switch (type) {
            case EntityTransitionType.Reset: {
                const shape = new Map();
                for (const [key, value] of state.shape) {
                    if (value === ComponentFlags.Deleted) {
                        continue;
                    }
                    shape.set(key, ComponentFlags.None);
                }
                nextShape = shape;
                nextFlags &= ~EntityFlags.Created;
                break;
            }
            case EntityTransitionType.Destroy: {
                const shape = new Map();
                for (const key of state.shape.keys()) {
                    shape.set(key, ComponentFlags.Deleted);
                }
                nextShape = shape;
                nextFlags |= EntityFlags.Destroyed;
                break;
            }
            case EntityTransitionType.Disable: {
                nextFlags |= EntityFlags.Disabled;
                break;
            }
            case EntityTransitionType.Enable: {
                nextFlags &= ~EntityFlags.Disabled;
                break;
            }
            default: {
                assertUnreachable(type);
            }
        }

        for (let i = 0; i < this.componentSetStates.length; i++) {
            const currState = this.componentSetStates[i];
            if (currState.isMatching(nextShape, nextFlags)) {
                // Create new transition edge
                state.createEntityTransition(type, currState);
                return currState;
            }
        }

        const nextState = new ComponentSetState(nextShape, nextFlags);
        this.componentSetStates.push(nextState);
        state.createEntityTransition(type, nextState);
        return nextState;
    }

    private moveSet(setSrc: ComponentSet, setDest: ComponentSet, entityStorage: Entities): void {
        const setRefDest = setDest.state.setRef;

        let setEntryRefDest = setDest.length;
        let setEntryRefSrc = 0;

        while (setEntryRefSrc < setSrc.length) {
            const storageRef = setSrc.storageRefs[setEntryRefSrc];

            if (storageRef < 0) {
                // Skip empty entry
                setEntryRefSrc += 1;
                continue;
            }

            const entityRef = setSrc.entityRefs[setEntryRefSrc];

            // Create in set
            setDest.storageRefs.push(storageRef);
            setDest.entityRefs.push(entityRef);
            setDest.length += 1;

            entityStorage.updateEntry(entityRef, setRefDest, setEntryRefDest);

            setEntryRefDest += 1;
            setEntryRefSrc += 1;
        }

        // Clear src
        setSrc.clear();
    }

    private moveSetEntry(
        entityId: EntityId,
        entityRef: EntityRef,
        currSet: ComponentSet,
        nextState: ComponentSetState,
        nextSet: ComponentSet,
    ): ComponentSetStorageRef {
        const currSetEntryRef = this.entities.componentSetEntryRefs[entityRef];
        const currStorageRef = currSet.storageRefs[currSetEntryRef];

        if (nextSet === currSet) {
            // No move necessary
            return currStorageRef;
        } else if (currSet.storage === nextSet.storage) {
            // Just update set
            currSet.destroyEntry(currSetEntryRef);
            const nextSetEntryRef = nextSet.createEntry(entityRef, currStorageRef);
            this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);

            return currStorageRef;
        } else {
            // Storage move
            const nextStorageRef = nextSet.storage.createEntry(entityId);
            nextSet.storage.copyComponents(nextStorageRef, currSet.storage, currStorageRef, currSet.storage);
            currSet.storage.destroyEntry(currStorageRef);

            currSet.destroyEntry(currSetEntryRef);
            const nextSetEntryRef = nextSet.createEntry(entityRef, nextStorageRef);
            this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);

            return nextStorageRef;
        }
    }

    private moveSetEntryDeleteComponent(
        entityId: EntityId,
        entityRef: EntityRef,
        currSet: ComponentSet,
        nextState: ComponentSetState,
        nextSet: ComponentSet,
    ): void {
        if (nextSet === currSet) {
            // Nothing to do
            return;
        }

        const currSetEntryRef = this.entities.componentSetEntryRefs[entityRef];
        const currStorageRef = currSet.storageRefs[currSetEntryRef];

        const nextStorageRef = nextSet.storage.createEntry(entityId);
        nextSet.storage.copyComponents(nextStorageRef, currSet.storage, currStorageRef, nextSet.storage);
        currSet.storage.destroyEntry(currStorageRef);

        currSet.destroyEntry(currSetEntryRef);
        const nextSetEntryRef = nextSet.createEntry(entityRef, nextStorageRef);
        this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);
    }

    private moveSetEntryDestroyEntity(
        entityId: EntityId,
        entityRef: EntityRef,
        currSet: ComponentSet,
        nextState: ComponentSetState,
        nextSet: ComponentSet,
    ): void {
        const currSetEntryRef = this.entities.componentSetEntryRefs[entityRef];
        const currStorageRef = currSet.storageRefs[currSetEntryRef];

        const nextStorageRef = nextSet.storage.createEntry(entityId);
        currSet.storage.destroyEntry(currStorageRef);

        currSet.destroyEntry(currSetEntryRef);
        const nextSetEntryRef = nextSet.createEntry(entityRef, nextStorageRef);
        this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);
    }

    private resetComponentSets(): void {
        for (const set of this.componenSets) {
            const stateDest = this.makeEntityTransition(set.state, EntityTransitionType.Reset);

            if (set.state === stateDest || set.length === 0) {
                continue;
            }

            if (set.state.isEntityDestroyed()) {
                // Just drop data
                set.clear();
                continue;
            }

            const setDest = this.findOrCreateSet(stateDest);
            this.moveSet(set, setDest, this.entities);
        }
    }

    private updateSetEntry(
        entityRef: EntityRef,
        currSet: ComponentSet,
        nextState: ComponentSetState,
        nextSet: ComponentSet,
    ): void {
        if (nextSet === currSet) {
            return;
        }

        const currSetEntryRef = this.entities.componentSetEntryRefs[entityRef];
        const currStorageRef = currSet.storageRefs[currSetEntryRef];

        currSet.destroyEntry(currSetEntryRef);
        const nextSetEntryRef = nextSet.createEntry(entityRef, currStorageRef);
        this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);
    }
}

export class EntityComponentIterator<T extends Component> {
    private currComponents: Map<ComponentId, ComponentContainer>;
    private currEntityIds: EntityId[];
    private currFlags: EntityFlags;
    private currQuerySetIdx: number;
    private currSetEntryRef: ComponentSetEntryRef;
    private currShape: ComponentSetShape;
    private currStorageRef: number;
    private currStorageRefs: ComponentSetStorageRef[];
    private querySets: ComponentSet[];

    public constructor(querySets: ComponentSet[]) {
        this.querySets = querySets;

        this.currComponents = EMPTY_MAP;
        this.currShape = EMPTY_MAP;
        this.currEntityIds = EMPTY_ARRAY;
        this.currStorageRefs = EMPTY_ARRAY;
        this.currFlags = EntityFlags.None;
        this.currQuerySetIdx = -1;
        this.currStorageRef = -1;
        this.currSetEntryRef = -1;
    }

    public findComponent<U extends T>(componentId: ComponentIdOf<U>): U | undefined {
        const components = this.currComponents.get(componentId);

        if (components === undefined) {
            return undefined;
        }

        return components[this.currStorageRef] as U;
    }

    public getComponent<U extends T>(componentId: ComponentIdOf<U>): U {
        const components = this.currComponents.get(componentId);

        if (components === undefined) {
            throwError("Component id not found");
        }

        return components[this.currStorageRef] as U;
    }

    public getEntityId(): EntityId {
        return this.currEntityIds[this.currStorageRef];
    }

    public hasComponent(componentId: ComponentIdOf<T>): boolean {
        return this.currShape.has(componentId);
    }

    public hasComponentFlags(componentId: ComponentIdOf<T>, flags: ComponentFlags): boolean {
        const compFlags = this.currShape.get(componentId);
        return compFlags !== undefined && (compFlags & flags) === flags;
    }

    public hasEntityFlags(flags: EntityFlags): boolean {
        return (this.currFlags & flags) === flags;
    }

    public isEntityDestroyed(): boolean {
        return (this.currFlags & EntityFlags.Destroyed) !== 0;
    }

    public next(): boolean {
        let nextSetEntryRef = this.currSetEntryRef + 1;

        while (nextSetEntryRef < this.currStorageRefs.length) {
            const nextStorageRef = this.currStorageRefs[nextSetEntryRef];

            if (nextStorageRef >= 0) {
                this.currSetEntryRef = nextSetEntryRef;
                this.currStorageRef = nextStorageRef;

                return true;
            }

            nextSetEntryRef += 1;
        }

        return this.nextStorage();
    }

    private nextStorage(): boolean {
        let nextSetIdx = this.currQuerySetIdx + 1;

        while (nextSetIdx < this.querySets.length) {
            const componentSet = this.querySets[nextSetIdx];

            let nextSetEntryRef = 0;

            while (nextSetEntryRef < componentSet.storageRefs.length) {
                const nextStorageRef = componentSet.storageRefs[nextSetEntryRef];

                if (nextStorageRef >= 0) {
                    this.currQuerySetIdx = nextSetIdx;

                    this.currSetEntryRef = nextSetEntryRef;
                    this.currStorageRef = nextStorageRef;

                    this.currStorageRefs = componentSet.storageRefs;
                    this.currFlags = componentSet.state.flags;
                    this.currShape = componentSet.state.shape;
                    this.currComponents = componentSet.storage.components;
                    this.currEntityIds = componentSet.storage.entityIds;

                    return true;
                }

                nextSetEntryRef += 1;
            }

            nextSetIdx += 1;
        }

        return false;
    }
}

class Entities {
    private length: number;
    private nextEntityId: number;

    public componentSetEntryRefs: ComponentSetEntryRef[];
    public componentSetRefs: ComponentSetRef[];
    public versions: EntityVersion[];

    constructor() {
        this.versions = [];
        this.componentSetRefs = [];
        this.componentSetEntryRefs = [];
        this.nextEntityId = 0;
        this.length = 0;
    }

    public clear(_prune: boolean): void {
        this.versions = [];
        this.componentSetRefs = [];
        this.componentSetEntryRefs = [];
        this.length = 0;
        this.nextEntityId = 0;
    }

    public createEntityId(): EntityId {
        const entityId = this.nextEntityId;

        // TODO: Versioning
        this.nextEntityId += 1;

        return entityId as EntityId;
    }

    public createEntry(
        entityId: EntityId,
        componentSetRef: ComponentTableRef,
        componentSetEntryRef: ComponentSetEntryRef,
    ): void {
        const version = entityId >>> 24;

        this.versions.push(version);
        this.componentSetRefs.push(componentSetRef);
        this.componentSetEntryRefs.push(componentSetEntryRef);
        this.length += 1;
    }

    public destroyEntry(entityRef: number): void {
        this.componentSetRefs[entityRef] = -1;
        this.componentSetEntryRefs[entityRef] = -1;
    }

    public getRefOrThrow(entityId: EntityId): EntityRef {
        const ref = entityId & ENTITY_REF_MASK;
        const version = entityId >>> 24;

        if (this.length <= ref || this.versions[ref] !== version) {
            throwError("Entity '{}'not found", entityId);
        }

        return ref;
    }

    public updateEntry(entityRef: number, setRef: number, setEntryRef: number): void {
        this.componentSetRefs[entityRef] = setRef;
        this.componentSetEntryRefs[entityRef] = setEntryRef;
    }
}

class ComponentSetState implements EntityComponentQuery<Component> {
    public componentTransitions: ComponentTransition[];
    public entityTransitions: EntityTransition[];
    public flags: EntityFlags;
    public setRef: ComponentSetRef;
    public shape: ComponentSetShape;

    constructor(shape: ComponentSetShape, flags: EntityFlags) {
        this.shape = shape;
        this.flags = flags;
        this.componentTransitions = [];
        this.entityTransitions = [];
        this.setRef = -1;
    }

    public createComponentTransition(type: ComponentTransitionType, state: ComponentSetState, id: ComponentId): void {
        this.componentTransitions.push({ type, state, id, hits: 0 });
    }

    public createEntityTransition(type: EntityTransitionType, state: ComponentSetState): void {
        this.entityTransitions.push({ type, state, hits: 0 });
    }

    public hasComponent(componentId: ComponentId): boolean {
        return this.shape.has(componentId);
    }

    public hasComponentFlags(componentId: ComponentId, flags: ComponentFlags): boolean {
        const shapeFlags = this.shape.get(componentId);
        return shapeFlags !== undefined && (shapeFlags & flags) === flags;
    }

    public hasEntityFlags(flags: EntityFlags): boolean {
        return (this.flags & flags) === flags;
    }

    public isChanged(componentId: ComponentId): boolean {
        const shapeFlags = this.shape.get(componentId);
        return shapeFlags !== undefined && shapeFlags !== 0;
    }

    public isCreated(componentId: ComponentId): boolean {
        const flags = this.shape.get(componentId);
        return flags !== undefined && (flags & ComponentFlags.Created) !== 0;
    }

    public isDeleted(componentId: ComponentId): boolean {
        const shapeFlags = this.shape.get(componentId);
        return shapeFlags !== undefined && (shapeFlags & ComponentFlags.Deleted) !== 0;
    }

    public isDisabled(): boolean {
        return (this.flags & EntityFlags.Disabled) !== 0;
    }

    public isEntityDestroyed(): boolean {
        return (this.flags & EntityFlags.Destroyed) !== 0;
    }

    public isMatching(shape: ComponentSetShape, flags: EntityFlags): boolean {
        if (this.flags !== flags || this.shape.size !== shape.size) {
            return false;
        }

        for (const [key1, value1] of this.shape) {
            const value2 = shape.get(key1);
            if (value1 !== value2) {
                return false;
            }
        }

        return true;
    }

    public isTransient(): boolean {
        const transientFlags = EntityFlags.Created | EntityFlags.Destroyed;

        if ((this.flags & transientFlags) !== 0) {
            return true;
        }

        for (const value of this.shape.values()) {
            if (value !== ComponentFlags.None) {
                return true;
            }
        }

        return false;
    }

    public isUpdated(componentId: ComponentId): boolean {
        const shapeFlags = this.shape.get(componentId);
        return shapeFlags !== undefined && (shapeFlags & ComponentFlags.Updated) !== 0;
    }
}

class ComponentSet {
    public entityRefs: EntityRef[];
    public length: number;
    public state: ComponentSetState;
    public storage: ComponentSetStorage;
    public storageRefs: ComponentSetStorageRef[];

    constructor(state: ComponentSetState, storage: ComponentSetStorage) {
        this.state = state;
        this.storage = storage;

        this.storageRefs = [];
        this.entityRefs = [];
        this.length = 0;
    }

    public clear(): void {
        this.entityRefs = [];
        this.storageRefs = [];
        this.length = 0;
    }

    public createEntry(entityRef: EntityRef, storageRef: ComponentSetStorageRef): ComponentSetEntryRef {
        const nextEntryRef = this.length;

        this.storageRefs.push(storageRef);
        this.entityRefs.push(entityRef);
        this.length += 1;

        return nextEntryRef;
    }

    public destroyEntry(setEntryRef: ComponentSetEntryRef): void {
        this.storageRefs[setEntryRef] = -1;
        this.entityRefs[setEntryRef] = -1;
    }

    public getComponent<T extends Component>(
        componentId: ComponentIdOf<T>,
        componentSetEntryRef: ComponentSetEntryRef,
    ): T | undefined {
        const components = this.storage.components.get(componentId);

        if (components === undefined) {
            return undefined;
        }

        const storageRef = this.storageRefs[componentSetEntryRef];

        return components[storageRef] as T;
    }

    public setComponent(currSetEntryRef: number, component: Component): void {
        const storageRef = this.storageRefs[currSetEntryRef];
        this.storage.setComponent(storageRef, component);
    }
}

class ComponentSetStorage {
    public components: Map<ComponentId, ComponentContainer>;
    public entityIds: EntityId[];
    public flags: StorageFlags;
    public length: number;

    constructor(components: Map<string, ComponentContainer>, flags: StorageFlags) {
        this.components = components;
        this.flags = flags;

        this.entityIds = [];
        this.length = 0;
    }

    public clear(): void {
        for (const key of this.components.keys()) {
            this.components.set(key, []);
        }

        this.entityIds = [];
    }

    public copyComponents(
        storageRef: ComponentSetStorageRef,
        storageSrc: ComponentSetStorage,
        storageRefSrc: ComponentSetStorageRef,
        storageKeys: ComponentSetStorage,
    ): void {
        for (const id of storageKeys.components.keys()) {
            const compContainerSrc = storageSrc.components.get(id);
            const compContainerDest = this.components.get(id);
            assertDebug(compContainerSrc !== undefined && compContainerDest !== undefined);
            compContainerDest[storageRef] = compContainerSrc[storageRefSrc];
        }
    }

    public createEntry(entityId: EntityId): ComponentSetStorageRef {
        const ref = this.nextRef();

        this.entityIds[ref] = entityId;

        return ref;
    }

    public destroyEntry(storageRef: ComponentSetStorageRef): void {
        for (const id of this.components.keys()) {
            const compContainer = this.components.get(id);
            assertDebug(compContainer !== undefined);
            compContainer[storageRef] = EMPTY_COMPONENT;
        }

        this.entityIds[storageRef] = -1 as EntityId;
    }

    public isMatching(componentIds: ComponentId[], flags: StorageFlags): boolean {
        if (this.flags !== flags || this.components.size !== componentIds.length) {
            return false;
        }

        for (const compId of componentIds) {
            if (!this.components.has(compId)) {
                return false;
            }
        }

        return true;
    }

    public setComponent(storageRef: ComponentSetStorageRef, value: Component): void {
        const compContainer = this.components.get(value.componentId);
        assertDebug(compContainer !== undefined);
        compContainer[storageRef] = value;
    }

    public setComponents(ref: ComponentSetStorageRef, components: Component[]): void {
        for (const comp of components) {
            const compContainer = this.components.get(comp.componentId);
            assertDebug(compContainer !== undefined);
            compContainer[ref] = comp;
        }
    }

    private nextRef(): ComponentSetStorageRef {
        const nextRef = this.length;

        for (const components of this.components.values()) {
            components.push(EMPTY_COMPONENT);
        }

        this.entityIds.push(-1 as EntityId);
        this.length += 1;

        return nextRef;
    }
}

export function buildComponenSetStateGraphviz(states: ComponentSetState[], rankdir = "TB"): string {
    let data = `digraph {
forcelabels = true;
rankdir = ${rankdir}
bgcolor = white
node [shape=oval, style=filled, fontname=arial, fontsize=10]
edge [fontname=arial, fontsize=8]
`;
    for (let i = 0; i < states.length; i++) {
        const { shape, flags, setRef } = states[i];
        const fill = states[i].isTransient() ? "tan" : "lavender";
        let label = "";
        for (const [id, flags] of shape) {
            label += `<b>${id}</b>: <i>${componentFlagsStrings(flags).join(" | ")}</i><br/>`;
        }
        label += `flags: <i>${entityFlagsStrings(flags).join(" | ")}</i><br/>`;
        label += `set: <i>${setRef}</i>`;
        data += `"${i}" [fillcolor=${fill}, label=<${label}>]\n`;
    }
    for (let i = 0; i < states.length; i++) {
        const { componentTransitions, entityTransitions } = states[i];
        for (const transition of componentTransitions) {
            const j = states.indexOf(transition.state);
            const label = `<b>${componentTransitionTypeString(transition.type)}</b>: <i>${transition.id}</i>`;
            data += `{ "${i}" -> "${j}" [color=blue, label=<${label}>] }\n`;
        }
        for (const transition of entityTransitions) {
            const j = states.indexOf(transition.state);
            const label = `<b>${entityTransitionTypeString(transition.type)}</b>`;
            data += `{ "${i}" -> "${j}" [color=red, label=<${label}>] }\n`;
        }
    }
    data += `}`;

    return data;

    function entityTransitionTypeString(type: EntityTransitionType): string {
        switch (type) {
            case EntityTransitionType.Reset:
                return "Reset";
            case EntityTransitionType.Destroy:
                return "Destroy";
            case EntityTransitionType.Disable:
                return "Disable";
            case EntityTransitionType.Enable:
                return "Enable";
            default:
                assertUnreachable(type);
        }
    }

    function componentTransitionTypeString(type: ComponentTransitionType): string {
        switch (type) {
            case ComponentTransitionType.Add:
                return "Add";
            case ComponentTransitionType.Set:
                return "Set";
            case ComponentTransitionType.Update:
                return "Update";
            case ComponentTransitionType.Delete:
                return "Delete";
            default:
                assertUnreachable(type);
        }
    }

    function entityFlagsStrings(flags: EntityFlags): string[] {
        const strings: string[] = [];

        if (flags === EntityFlags.None) {
            strings.push("None");
        }

        if ((flags & EntityFlags.Created) !== 0) {
            strings.push("Created");
        }

        if ((flags & EntityFlags.Destroyed) !== 0) {
            strings.push("Destroyed");
        }

        if ((flags & EntityFlags.Disabled) !== 0) {
            strings.push("Disabled");
        }

        return strings;
    }

    function componentFlagsStrings(flags: ComponentFlags): string[] {
        const strings: string[] = [];

        if (flags === ComponentFlags.None) {
            strings.push("None");
        }

        if ((flags & ComponentFlags.Created) !== 0) {
            strings.push("Created");
        }

        if ((flags & ComponentFlags.Updated) !== 0) {
            strings.push("Updated");
        }

        if ((flags & ComponentFlags.Deleted) !== 0) {
            strings.push("Deleted");
        }

        return strings;
    }
}
