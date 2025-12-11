import { assertDebug, assertUnreachable, log, throwError } from "redgeometry/src/utility/debug";
import type { Enum } from "redgeometry/src/utility/types";
import type { Component, ComponentId, ComponentIdOf, EntityComponentQueryValue, EntityId } from "./types.ts";
import { ComponentFlags, EntityFlags } from "./world.ts";

export type EntityRef = number;
export type EntityVersion = number;

export type EntityComponentSetEntryRef = number;
export type EntityComponentSetRef = number;
export type EntityComponentSetStorageEntryRef = number;

export type ComponentContainer = (Component | null)[];
export type ComponentStates = ReadonlyMap<ComponentId, ComponentState>;

export type EntityComponentQuerySet = { componentSet: EntityComponentSet; maxLength: number };

export type EntityState = {
    flags: EntityFlags;
};

export type ComponentState = {
    flags: ComponentFlags;
};

export type EntityTransition = {
    type: EntityTransitionType;
    setState: EntityComponentSetState;
};

export type ComponentTransition = {
    type: ComponentTransitionType;
    componentId: ComponentId;
    setState: EntityComponentSetState;
};

export const EntityTransitionType = {
    RESET: 0,
    DESTROY: 1,
} as const;
export type EntityTransitionType = Enum<typeof EntityTransitionType>;

export const ComponentTransitionType = {
    ADD: 0,
    UPDATE: 1,
    SET: 2,
    DELETE: 3,
} as const;
export type ComponentTransitionType = Enum<typeof ComponentTransitionType>;

type ComponentSetJournalEntry = {
    componentSet: EntityComponentSet;
};

const EMPTY_MAP: ReadonlyMap<never, never> = new Map<never, never>();
const EMPTY_ARRAY: ReadonlyArray<never> = [];

export class EntityComponentStorage {
    public entities: Entities;
    public rootSetState: EntityComponentSetState | undefined;
    public setJournalEntries: ComponentSetJournalEntry[];
    public setStates: EntityComponentSetState[];
    public setStorages: EntityComponentSetStorage[];
    public sets: EntityComponentSet[];

    constructor() {
        this.entities = new Entities();
        this.rootSetState = undefined;
        this.setJournalEntries = [];
        this.setStates = [];
        this.setStorages = [];
        this.sets = [];
    }

    public addComponent<T extends Component>(entityId: EntityId, component: T): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(
            currSet.state,
            component.componentId,
            ComponentTransitionType.ADD,
        );
        const nextSet = this.findOrCreateSet(nextState);

        const storageEntryRef = this.moveSetEntry(entityId, entityRef, currSet, nextState, nextSet);
        nextSet.storage.setComponent(storageEntryRef, component);
    }

    public clear(): void {
        this.rootSetState = undefined;
        this.setJournalEntries = [];
        this.setStates = [];
        this.setStorages = [];
        this.sets = [];

        this.entities.clear();
    }

    public createEntity(): EntityId {
        const entityId = this.entities.recycleOrCreateEntry();
        const nextState = this.findOrCreateRootSetState();
        const nextSet = this.findOrCreateSet(nextState);

        this.createSetEntry(entityId, nextState, nextSet);

        return entityId;
    }

    public deleteComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(currSet.state, componentId, ComponentTransitionType.DELETE);
        const nextSet = this.findOrCreateSet(nextState);

        this.moveSetEntryDeleteComponent(entityId, entityRef, currSet, nextState, nextSet);
    }

    public destroyEntity(entityId: EntityId): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeEntityTransition(currSet.state, EntityTransitionType.DESTROY);
        const nextSet = this.findOrCreateSet(nextState);

        this.moveSetEntryDestroyEntity(entityId, entityRef, currSet, nextState, nextSet);
    }

    public findComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        const entityRef = this.entities.getRefOrError(entityId);

        if (entityRef < 0) {
            return undefined;
        }

        const currSet = this.getComponentSet(entityRef);
        const setEntryRef = this.entities.setEntryRefs[entityRef];

        return currSet.findComponent(componentId, setEntryRef);
    }

    public getComponentFlags<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): ComponentFlags {
        const entityRef = this.entities.getRefOrError(entityId);

        if (entityRef < 0) {
            return ComponentFlags.NONE;
        }

        const currSet = this.getComponentSet(entityRef);

        return currSet.state.getComponentFlags(componentId);
    }

    public getComponents(entityId: EntityId): Component[] {
        const entityRef = this.entities.getRefOrError(entityId);

        if (entityRef < 0) {
            return [];
        }

        const currSet = this.getComponentSet(entityRef);
        const setEntryRef = this.entities.setEntryRefs[entityRef];

        return currSet.getComponents(setEntryRef);
    }

    public getEntityFlags(entityId: EntityId): EntityFlags {
        const entityRef = this.entities.getRefOrError(entityId);
        const currSet = this.getComponentSet(entityRef);

        if (entityRef < 0) {
            return EntityFlags.NONE;
        }

        return currSet.state.getEntityFlags();
    }

    public hasComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): boolean {
        const entityRef = this.entities.getRefOrError(entityId);

        if (entityRef < 0) {
            return false;
        }

        const currSet = this.getComponentSet(entityRef);

        return currSet.state.hasComponent(componentId);
    }

    public hasComponentFlags<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flagMask: ComponentFlags,
    ): boolean {
        const flags = this.getComponentFlags(entityId, componentId);
        return hasFlags(flags, flagMask);
    }

    public hasComponentFlagsAny<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flagMask: ComponentFlags,
    ): boolean {
        const flags = this.getComponentFlags(entityId, componentId);
        return hasFlagsAny(flags, flagMask);
    }

    public hasEntityFlags(entityId: EntityId, flagMask: EntityFlags): boolean {
        const flags = this.getEntityFlags(entityId);
        return hasFlags(flags, flagMask);
    }

    public hasEntityFlagsAny(entityId: EntityId, flagMask: EntityFlags): boolean {
        const flags = this.getEntityFlags(entityId);
        return hasFlagsAny(flags, flagMask);
    }

    public isEntityAlive(entityId: EntityId): boolean {
        const entityRef = this.entities.getRef(entityId);

        if (entityRef < 0) {
            return false;
        }

        const currSet = this.getComponentSet(entityRef);
        const flags = currSet.state.getEntityFlags();

        return hasFlagsAny(flags, EntityFlags.DEFAULT | EntityFlags.CREATED);
    }

    public isEntityValid(entityId: EntityId): boolean {
        const entityRef = this.entities.getRef(entityId);

        return entityRef >= 0;
    }

    /**
     * Returns an iterator over the entities filtered by `predicate`.
     */
    public queryEntities<T extends Component, U extends T>(
        predicate: (q: EntityComponentQueryValue<T>) => boolean,
    ): EntityComponentIterator<U> {
        const querySets: EntityComponentQuerySet[] = [];

        for (const componentSet of this.sets) {
            if (componentSet.isEmpty()) {
                continue;
            }

            if (predicate(componentSet.state)) {
                querySets.push({
                    componentSet,
                    maxLength: componentSet.capacity,
                });
            }
        }

        return new EntityComponentIterator(querySets);
    }

    public reset(): void {
        for (const entry of this.setJournalEntries) {
            this.resetComponentSet(entry.componentSet);
        }

        if (this.setJournalEntries.length > 0) {
            this.setJournalEntries = [];
        }
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(
            currSet.state,
            component.componentId,
            ComponentTransitionType.SET,
        );
        const nextSet = this.findOrCreateSet(nextState);

        const storageEntryRef = this.moveSetEntry(entityId, entityRef, currSet, nextState, nextSet);
        nextSet.storage.setComponent(storageEntryRef, component);
    }

    public updateComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        const entityRef = this.entities.getRefOrThrow(entityId);
        const currSet = this.getComponentSet(entityRef);
        const nextState = this.makeComponentTransition(currSet.state, componentId, ComponentTransitionType.UPDATE);
        const nextSet = this.findOrCreateSet(nextState);

        this.updateSetEntry(entityRef, currSet, nextState, nextSet);
    }

    private createSetEntry(
        entityId: EntityId,
        nextState: EntityComponentSetState,
        nextSet: EntityComponentSet,
    ): EntityComponentSetStorageEntryRef {
        const entityRef = entityId >> Entities.REF_BIT_SHIFT;

        const storageEntryRef = nextSet.storage.recycleOrCreateEntry(entityId);
        const setEntryRef = nextSet.createEntry(entityRef, storageEntryRef);

        this.entities.updateEntry(entityRef, nextState.setRef, setEntryRef);

        return storageEntryRef;
    }

    private findOrCreateRootSetState(): EntityComponentSetState {
        let setState = this.rootSetState;

        if (setState === undefined) {
            const entState: EntityState = {
                flags: EntityFlags.CREATED,
            };

            setState = new EntityComponentSetState(EMPTY_MAP, entState);

            this.rootSetState = setState;
        }

        return setState;
    }

    private findOrCreateSet(setState: EntityComponentSetState): EntityComponentSet {
        if (setState.setRef < 0) {
            const setStorage = this.findOrCreateSetStorage(setState);
            const isTransient = setState.isTransient();
            const newSet = new EntityComponentSet(setState, setStorage, isTransient);

            setState.setRef = this.sets.length;

            this.sets.push(newSet);
        }

        const set = this.sets[setState.setRef];

        if (!set.hasJournalEntry && set.isTransient) {
            this.setJournalEntries.push({ componentSet: set });
            set.hasJournalEntry = true;
        }

        return set;
    }

    private findOrCreateSetStorage(setState: EntityComponentSetState): EntityComponentSetStorage {
        const compFlagMask = ComponentFlags.DEFAULT | ComponentFlags.ADDED | ComponentFlags.UPDATED;
        const compIds: ComponentId[] = [];

        for (const compId of setState.componentStates.keys()) {
            if (setState.hasComponentFlagsAny(compId, compFlagMask)) {
                compIds.push(compId);
            }
        }

        for (const storage of this.setStorages) {
            if (storage.isMatching(compIds)) {
                return storage;
            }
        }

        const components = new Map<string, ComponentContainer>();
        for (const compId of compIds) {
            components.set(compId, []);
        }

        const storage = new EntityComponentSetStorage(components);
        this.setStorages.push(storage);

        return storage;
    }

    private getComponentSet(entityRef: EntityRef): EntityComponentSet {
        const componentSetRef = this.entities.setRefs[entityRef];
        return this.sets[componentSetRef];
    }

    private makeComponentTransition(
        setState: EntityComponentSetState,
        componentId: ComponentId,
        type: ComponentTransitionType,
    ): EntityComponentSetState {
        for (const transition of setState.componentTransitions) {
            if (transition.componentId === componentId && transition.type === type) {
                // Found cached transition
                return transition.setState;
            }
        }

        // New transition
        const entState = setState.entityState;
        const nextCompState = setState.getNextComponenentState(componentId);

        const compFlagMask = ComponentFlags.DEFAULT | ComponentFlags.ADDED | ComponentFlags.UPDATED;

        assertDebug(entState.flags !== EntityFlags.NONE, "Entity flags must not be 'None'");

        switch (type) {
            case ComponentTransitionType.ADD: {
                if (hasFlags(entState.flags, EntityFlags.DESTROYED)) {
                    throwError("Unable to add component id '{}' because entity has been destroyed", componentId);
                }

                if (hasFlagsAny(nextCompState.flags, compFlagMask)) {
                    throwError("Unable to add component id '{}' because it already exists on entity", componentId);
                } else {
                    // Set `Added | Updated`
                    nextCompState.flags |= ComponentFlags.ADDED | ComponentFlags.UPDATED;
                }

                break;
            }
            case ComponentTransitionType.UPDATE: {
                if (hasFlags(entState.flags, EntityFlags.DESTROYED)) {
                    throwError("Unable to update component id '{}' because entity has been destroyed", componentId);
                }

                if (hasFlagsAny(nextCompState.flags, compFlagMask)) {
                    // Set `Updated` and unset `Default`
                    nextCompState.flags |= ComponentFlags.UPDATED;
                    nextCompState.flags &= ~ComponentFlags.DEFAULT;
                } else {
                    throwError("Unable to update component id '{}'", componentId);
                }

                break;
            }
            case ComponentTransitionType.SET: {
                if (hasFlags(entState.flags, EntityFlags.DESTROYED)) {
                    throwError("Unable to set component id '{}' because entity has been destroyed", componentId);
                }

                if (hasFlagsAny(nextCompState.flags, compFlagMask)) {
                    // Set `Updated` and unset `Default`
                    nextCompState.flags |= ComponentFlags.UPDATED;
                    nextCompState.flags &= ~ComponentFlags.DEFAULT;
                } else {
                    // Set `Added | Updated`
                    nextCompState.flags |= ComponentFlags.ADDED | ComponentFlags.UPDATED;
                }

                break;
            }
            case ComponentTransitionType.DELETE: {
                if (hasFlags(entState.flags, EntityFlags.DESTROYED)) {
                    throwError("Unable to delete component id '{}' because entity has been destroyed", componentId);
                }

                // Deleting an already deleted component is silent
                if (hasFlagsAny(nextCompState.flags, compFlagMask)) {
                    nextCompState.flags = ComponentFlags.DELETED;
                }

                break;
            }
            default: {
                assertUnreachable(type);
            }
        }

        const nextCompStates = new Map(setState.componentStates);
        nextCompStates.set(componentId, nextCompState);

        for (let i = 0; i < this.setStates.length; i++) {
            const currSetState = this.setStates[i];
            if (currSetState.isMatching(nextCompStates, entState)) {
                // Create new transition edge
                setState.createComponentTransition(type, componentId, currSetState);
                return currSetState;
            }
        }

        const nextSetState = new EntityComponentSetState(nextCompStates, entState);
        this.setStates.push(nextSetState);
        setState.createComponentTransition(type, componentId, nextSetState);
        return nextSetState;
    }

    private makeEntityTransition(
        setState: EntityComponentSetState,
        type: EntityTransitionType,
    ): EntityComponentSetState {
        for (const transition of setState.entityTransitions) {
            if (transition.type === type) {
                // Found cached transition
                return transition.setState;
            }
        }

        // New transition
        const nextEntState = setState.getNextEntityState();
        let nextCompStates = setState.componentStates;

        assertDebug(nextEntState.flags !== EntityFlags.NONE, "Entity flags must not be empty");

        switch (type) {
            case EntityTransitionType.RESET: {
                if (hasFlags(nextEntState.flags, EntityFlags.DESTROYED)) {
                    // Clear all flags
                    nextEntState.flags = EntityFlags.NONE;
                } else {
                    // Set `Default` and unset `Created`
                    nextEntState.flags |= EntityFlags.DEFAULT;
                    nextEntState.flags &= ~EntityFlags.CREATED;
                }

                // Drop components with `Deleted`
                const compFlagMask = ComponentFlags.DEFAULT | ComponentFlags.ADDED | ComponentFlags.UPDATED;
                const compStates = new Map<ComponentId, ComponentState>();
                const compState: ComponentState = {
                    flags: ComponentFlags.DEFAULT,
                };
                for (const compId of setState.componentStates.keys()) {
                    if (setState.hasComponentFlagsAny(compId, compFlagMask)) {
                        compStates.set(compId, compState);
                    }
                }
                nextCompStates = compStates;

                break;
            }
            case EntityTransitionType.DESTROY: {
                // Set `Destroyed` and unset `Default | Created`
                nextEntState.flags |= EntityFlags.DESTROYED;
                nextEntState.flags &= ~(EntityFlags.DEFAULT | EntityFlags.CREATED);

                // Set all components to `Deleted`
                const compStates = new Map<ComponentId, ComponentState>();
                const compState: ComponentState = {
                    flags: ComponentFlags.DELETED,
                };
                for (const compId of setState.componentStates.keys()) {
                    compStates.set(compId, compState);
                }
                nextCompStates = compStates;

                break;
            }
            default: {
                assertUnreachable(type);
            }
        }

        for (let i = 0; i < this.setStates.length; i++) {
            const currSetState = this.setStates[i];
            if (currSetState.isMatching(nextCompStates, nextEntState)) {
                // Create new transition edge
                setState.createEntityTransition(type, currSetState);
                return currSetState;
            }
        }

        const nextSetState = new EntityComponentSetState(nextCompStates, nextEntState);
        this.setStates.push(nextSetState);
        setState.createEntityTransition(type, nextSetState);
        return nextSetState;
    }

    private moveSetEntries(setSrc: EntityComponentSet, setDest: EntityComponentSet): void {
        const setRefDest = setDest.state.setRef;

        let setEntryRefSrc = 0;

        while (setEntryRefSrc < setSrc.capacity) {
            const storageEntryRef = setSrc.storageEntryRefs[setEntryRefSrc];

            if (storageEntryRef < 0) {
                // Skip empty entry
                setEntryRefSrc += 1;
                continue;
            }

            const entityRef = setSrc.entityRefs[setEntryRefSrc];

            const setEntryRefDest = setDest.recycleOrCreateEntry(entityRef, storageEntryRef);
            this.entities.updateEntry(entityRef, setRefDest, setEntryRefDest);

            setEntryRefSrc += 1;
        }
    }

    private moveSetEntriesDestroy(setSrc: EntityComponentSet): void {
        let setEntryRefSrc = 0;

        while (setEntryRefSrc < setSrc.capacity) {
            const storageEntryRef = setSrc.storageEntryRefs[setEntryRefSrc];

            if (storageEntryRef < 0) {
                // Skip empty entry
                setEntryRefSrc += 1;
                continue;
            }

            const entityRef = setSrc.entityRefs[setEntryRefSrc];

            setSrc.storage.destroyEntry(storageEntryRef);
            this.entities.destroyEntry(entityRef);

            setEntryRefSrc += 1;
        }
    }

    private moveSetEntry(
        entityId: EntityId,
        entityRef: EntityRef,
        currSet: EntityComponentSet,
        nextState: EntityComponentSetState,
        nextSet: EntityComponentSet,
    ): EntityComponentSetStorageEntryRef {
        const currSetEntryRef = this.entities.setEntryRefs[entityRef];
        const currStorageEntryRef = currSet.storageEntryRefs[currSetEntryRef];

        if (nextSet === currSet) {
            // No move necessary
            return currStorageEntryRef;
        } else if (currSet.storage === nextSet.storage) {
            // Just update set
            currSet.destroyEntry(currSetEntryRef);
            const nextSetEntryRef = nextSet.createEntry(entityRef, currStorageEntryRef);
            this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);

            return currStorageEntryRef;
        } else {
            // Storage move
            const nextStorageEntryRef = nextSet.storage.recycleOrCreateEntry(entityId);
            nextSet.storage.copyComponents(nextStorageEntryRef, currSet.storage, currStorageEntryRef, currSet.storage);
            currSet.storage.destroyEntry(currStorageEntryRef);

            currSet.destroyEntry(currSetEntryRef);
            const nextSetEntryRef = nextSet.createEntry(entityRef, nextStorageEntryRef);
            this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);

            return nextStorageEntryRef;
        }
    }

    private moveSetEntryDeleteComponent(
        entityId: EntityId,
        entityRef: EntityRef,
        currSet: EntityComponentSet,
        nextState: EntityComponentSetState,
        nextSet: EntityComponentSet,
    ): void {
        if (nextSet === currSet) {
            // Nothing to do
            return;
        }

        const currSetEntryRef = this.entities.setEntryRefs[entityRef];
        const currStorageEntryRef = currSet.storageEntryRefs[currSetEntryRef];

        const nextStorageEntryRef = nextSet.storage.recycleOrCreateEntry(entityId);
        nextSet.storage.copyComponents(nextStorageEntryRef, currSet.storage, currStorageEntryRef, nextSet.storage);
        currSet.storage.destroyEntry(currStorageEntryRef);

        currSet.destroyEntry(currSetEntryRef);
        const nextSetEntryRef = nextSet.createEntry(entityRef, nextStorageEntryRef);
        this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);
    }

    private moveSetEntryDestroyEntity(
        entityId: EntityId,
        entityRef: EntityRef,
        currSet: EntityComponentSet,
        nextState: EntityComponentSetState,
        nextSet: EntityComponentSet,
    ): void {
        const currSetEntryRef = this.entities.setEntryRefs[entityRef];
        const currStorageEntryRef = currSet.storageEntryRefs[currSetEntryRef];

        const nextStorageEntryRef = nextSet.storage.recycleOrCreateEntry(entityId);
        currSet.storage.destroyEntry(currStorageEntryRef);

        currSet.destroyEntry(currSetEntryRef);
        const nextSetEntryRef = nextSet.createEntry(entityRef, nextStorageEntryRef);
        this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);
    }

    private resetComponentSet(set: EntityComponentSet): void {
        if (set.isEmpty()) {
            if (set.freeRefs.length > 0) {
                set.clear();
            }
            return;
        }

        const setStateDest = this.makeEntityTransition(set.state, EntityTransitionType.RESET);
        assertDebug(set.state !== setStateDest, "Invalid reset transition");

        const entFlags = setStateDest.getEntityFlags();

        if (entFlags !== EntityFlags.NONE) {
            const setDest = this.findOrCreateSet(setStateDest);
            this.moveSetEntries(set, setDest);
        } else {
            this.moveSetEntriesDestroy(set);
        }

        set.clear();
    }

    private updateSetEntry(
        entityRef: EntityRef,
        currSet: EntityComponentSet,
        nextState: EntityComponentSetState,
        nextSet: EntityComponentSet,
    ): void {
        if (nextSet === currSet) {
            return;
        }

        const currSetEntryRef = this.entities.setEntryRefs[entityRef];
        const currStorageEntryRef = currSet.storageEntryRefs[currSetEntryRef];

        currSet.destroyEntry(currSetEntryRef);
        const nextSetEntryRef = nextSet.createEntry(entityRef, currStorageEntryRef);
        this.entities.updateEntry(entityRef, nextState.setRef, nextSetEntryRef);
    }
}

export class Entities {
    public static readonly INVALID_ID = (0xffffff00 | 0) as EntityId;
    public static readonly REF_BIT_SHIFT = 8;
    public static readonly REF_LIMIT = 0x00800000;
    public static readonly VERSION_MASK = 0x000000ff;

    public capacity: number;
    public freeIds: EntityId[];
    public setEntryRefs: EntityComponentSetEntryRef[];
    public setRefs: EntityComponentSetRef[];
    public versions: EntityVersion[];

    constructor() {
        this.capacity = 0;
        this.freeIds = [];
        this.setEntryRefs = [];
        this.setRefs = [];
        this.versions = [];
    }

    public clear(): void {
        this.capacity = 0;
        this.freeIds = [];
        this.setEntryRefs = [];
        this.setRefs = [];
        this.versions = [];
    }

    public createEntry(): EntityId {
        const nextRef = this.capacity;
        const nextVersion = 1;

        if (nextRef >= Entities.REF_LIMIT) {
            throwError("Entity ref limit of '{}' reached", Entities.REF_LIMIT);
        }

        this.versions.push(nextVersion);
        this.setRefs.push(-1);
        this.setEntryRefs.push(-1);
        this.capacity += 1;

        const nextId = (nextRef << Entities.REF_BIT_SHIFT) | nextVersion;

        return nextId as EntityId;
    }

    public destroyEntry(entityRef: EntityRef): void {
        // Invalidate entry
        const nextId = this.invalidateId(entityRef);

        this.versions[entityRef] = 0;
        this.setRefs[entityRef] = -1;
        this.setEntryRefs[entityRef] = -1;

        this.freeIds.push(nextId);
    }

    public getRef(entityId: EntityId): EntityRef {
        const ref = entityId >> Entities.REF_BIT_SHIFT;
        const version = entityId & Entities.VERSION_MASK;

        if (ref >= this.capacity || version !== this.versions[ref]) {
            return -1;
        }

        return ref;
    }

    public getRefOrError(entityId: EntityId): EntityRef {
        const ref = entityId >> Entities.REF_BIT_SHIFT;
        const version = entityId & Entities.VERSION_MASK;

        if (ref >= this.capacity || version !== this.versions[ref]) {
            log.error("Entity id '{}' not found", entityId);
            return -1;
        }

        return ref;
    }

    public getRefOrThrow(entityId: EntityId): EntityRef {
        const ref = entityId >> Entities.REF_BIT_SHIFT;
        const version = entityId & Entities.VERSION_MASK;

        if (ref >= this.capacity || version !== this.versions[ref]) {
            throwError("Entity id '{}' not found", entityId);
        }

        return ref;
    }

    public recycleOrCreateEntry(): EntityId {
        // Try to reuse a free entry
        const nextId = this.freeIds.pop();

        if (nextId === undefined) {
            // No free entries
            return this.createEntry();
        }

        const ref = nextId >> Entities.REF_BIT_SHIFT;
        const version = nextId & Entities.VERSION_MASK;

        this.versions[ref] = version;

        return nextId;
    }

    public updateEntry(
        entityRef: EntityRef,
        componentSetRef: EntityComponentSetRef,
        componentSetEntryRef: EntityComponentSetEntryRef,
    ): void {
        this.setRefs[entityRef] = componentSetRef;
        this.setEntryRefs[entityRef] = componentSetEntryRef;
    }

    private invalidateId(entityRef: EntityRef): EntityId {
        // Reuse entity id with updated version
        let nextVersion = (this.versions[entityRef] + 1) & Entities.VERSION_MASK;

        if (nextVersion === 0) {
            // `0` means invalid version/entity
            nextVersion = 1;
        }

        const nextId = nextVersion | (entityRef << Entities.REF_BIT_SHIFT);

        return nextId as EntityId;
    }
}

export class EntityComponentSetState implements EntityComponentQueryValue<Component> {
    public componentStates: ComponentStates;
    public componentTransitions: ComponentTransition[];
    public entityState: EntityState;
    public entityTransitions: EntityTransition[];
    public setRef: EntityComponentSetRef;

    constructor(componentStates: ComponentStates, entityState: EntityState) {
        this.componentStates = componentStates;
        this.entityState = entityState;

        this.componentTransitions = [];
        this.entityTransitions = [];
        this.setRef = -1;
    }

    public createComponentTransition(
        type: ComponentTransitionType,
        componentId: ComponentId,
        setState: EntityComponentSetState,
    ): void {
        this.componentTransitions.push({ type, componentId, setState });
    }

    public createEntityTransition(type: EntityTransitionType, setState: EntityComponentSetState): void {
        this.entityTransitions.push({ type, setState });
    }

    public getComponentFlags(componentId: ComponentId): ComponentFlags {
        const compState = this.componentStates.get(componentId);

        if (compState === undefined) {
            return ComponentFlags.NONE;
        }

        return compState.flags;
    }

    public getEntityFlags(): EntityFlags {
        return this.entityState.flags;
    }

    public getNextComponenentState(componentId: ComponentId): ComponentState {
        const compState = this.componentStates.get(componentId);

        if (compState === undefined) {
            return {
                flags: ComponentFlags.NONE,
            };
        }

        return { ...compState };
    }

    public getNextEntityState(): EntityState {
        return { ...this.entityState };
    }

    public hasComponent(componentId: ComponentId): boolean {
        const flags = this.getComponentFlags(componentId);
        return hasFlagsAny(flags, ComponentFlags.DEFAULT | ComponentFlags.ADDED | ComponentFlags.UPDATED);
    }

    public hasComponentFlags(componentId: ComponentId, flagMask: ComponentFlags): boolean {
        const flags = this.getComponentFlags(componentId);
        return hasFlags(flags, flagMask);
    }

    public hasComponentFlagsAny(componentId: ComponentId, flagMask: ComponentFlags): boolean {
        const flags = this.getComponentFlags(componentId);
        return hasFlagsAny(flags, flagMask);
    }

    public hasEntityFlags(flagMask: EntityFlags): boolean {
        const flags = this.getEntityFlags();
        return hasFlags(flags, flagMask);
    }

    public hasEntityFlagsAny(flagMask: EntityFlags): boolean {
        const flags = this.getEntityFlags();
        return hasFlagsAny(flags, flagMask);
    }

    public isEntityAlive(): boolean {
        const flags = this.getEntityFlags();
        return hasFlagsAny(flags, EntityFlags.DEFAULT | EntityFlags.CREATED);
    }

    public isMatching(componentStates: ComponentStates, entityState: EntityState): boolean {
        if (this.entityState.flags !== entityState.flags) {
            // Entity state does not match
            return false;
        }

        if (this.componentStates.size !== componentStates.size) {
            // Component state does not match
            return false;
        }

        for (const [compId, compState1] of this.componentStates) {
            const compState2 = componentStates.get(compId);
            if (compState2 === undefined) {
                // Component does not exist
                return false;
            }

            if (compState1.flags !== compState2.flags) {
                // Component state does not match
                return false;
            }
        }

        return true;
    }

    public isTransient(): boolean {
        if (this.hasEntityFlagsAny(EntityFlags.CREATED | EntityFlags.DESTROYED)) {
            return true;
        }

        for (const compId of this.componentStates.keys()) {
            if (this.hasComponentFlagsAny(compId, ~ComponentFlags.DEFAULT)) {
                return true;
            }
        }

        return false;
    }
}

export class EntityComponentSet {
    public capacity: number;
    public entityRefs: EntityRef[];
    public freeRefs: EntityComponentSetEntryRef[];
    public hasJournalEntry: boolean;
    public isTransient: boolean;
    public state: EntityComponentSetState;
    public storage: EntityComponentSetStorage;
    public storageEntryRefs: EntityComponentSetStorageEntryRef[];

    constructor(state: EntityComponentSetState, storage: EntityComponentSetStorage, isTransient: boolean) {
        this.state = state;
        this.storage = storage;
        this.isTransient = isTransient;

        this.capacity = 0;
        this.entityRefs = [];
        this.freeRefs = [];
        this.hasJournalEntry = false;
        this.storageEntryRefs = [];
    }

    public clear(): void {
        this.capacity = 0;
        this.entityRefs = [];
        this.freeRefs = [];
        this.hasJournalEntry = false;
        this.storageEntryRefs = [];
    }

    public createEntry(
        entityRef: EntityRef,
        storageEntryRef: EntityComponentSetStorageEntryRef,
    ): EntityComponentSetEntryRef {
        const nextRef = this.capacity;

        this.storageEntryRefs.push(storageEntryRef);
        this.entityRefs.push(entityRef);
        this.capacity += 1;

        return nextRef;
    }

    public destroyEntry(setEntryRef: EntityComponentSetEntryRef): void {
        // Invalidate entry
        this.storageEntryRefs[setEntryRef] = -1;
        this.entityRefs[setEntryRef] = -1;

        this.freeRefs.push(setEntryRef);
    }

    public findComponent<T extends Component>(
        componentId: ComponentIdOf<T>,
        componentSetEntryRef: EntityComponentSetEntryRef,
    ): T | undefined {
        const comps = this.storage.components.get(componentId);

        if (comps === undefined) {
            return undefined;
        }

        const ref = this.storageEntryRefs[componentSetEntryRef];
        const comp = comps[ref];

        if (comp === null) {
            throwError("Invalid storage ref '{}'", ref);
        }

        return comp as T;
    }

    public getComponents(componentSetEntryRef: EntityComponentSetEntryRef): Component[] {
        const ref = this.storageEntryRefs[componentSetEntryRef];
        const components: Component[] = [];

        for (const compContainer of this.storage.components.values()) {
            const comp = compContainer[ref];

            if (comp === null) {
                throwError("Invalid storage ref '{}'", ref);
            }

            components.push(comp);
        }

        return components;
    }

    public isEmpty(): boolean {
        return this.capacity === this.freeRefs.length;
    }

    public recycleOrCreateEntry(
        entityRef: EntityRef,
        storageEntryRef: EntityComponentSetStorageEntryRef,
    ): EntityComponentSetEntryRef {
        // Try to reuse a free entry
        const nextRef = this.freeRefs.pop();

        if (nextRef === undefined) {
            // No free entries
            return this.createEntry(entityRef, storageEntryRef);
        }

        this.storageEntryRefs[nextRef] = storageEntryRef;
        this.entityRefs[nextRef] = entityRef;

        return nextRef;
    }
}

export class EntityComponentSetStorage {
    public capacity: number;
    public components: Map<ComponentId, ComponentContainer>;
    public entityIds: EntityId[];
    public freeRefs: EntityComponentSetStorageEntryRef[];

    constructor(components: Map<string, ComponentContainer>) {
        this.components = components;

        this.capacity = 0;
        this.entityIds = [];
        this.freeRefs = [];
    }

    public clear(): void {
        for (const key of this.components.keys()) {
            this.components.set(key, []);
        }

        this.capacity = 0;
        this.entityIds = [];
        this.freeRefs = [];
    }

    public copyComponents(
        storageEntryRef: EntityComponentSetStorageEntryRef,
        storageSrc: EntityComponentSetStorage,
        storageEntryRefSrc: EntityComponentSetStorageEntryRef,
        storageKeys: EntityComponentSetStorage,
    ): void {
        for (const id of storageKeys.components.keys()) {
            const compContainerSrc = storageSrc.components.get(id);
            const compContainerDest = this.components.get(id);
            assertDebug(
                compContainerSrc !== undefined && compContainerDest !== undefined,
                "Containers must not be undefined",
            );
            compContainerDest[storageEntryRef] = compContainerSrc[storageEntryRefSrc];
        }
    }

    public createEntry(entityId: EntityId): EntityComponentSetStorageEntryRef {
        const nextRef = this.capacity;

        for (const components of this.components.values()) {
            components.push(null);
        }

        this.entityIds.push(entityId);
        this.capacity += 1;

        return nextRef;
    }

    public destroyEntry(storageEntryRef: EntityComponentSetStorageEntryRef): void {
        // Invalidate entry
        for (const id of this.components.keys()) {
            const compContainer = this.components.get(id);
            assertDebug(compContainer !== undefined, "Container must not be undefined");
            compContainer[storageEntryRef] = null;
        }

        this.entityIds[storageEntryRef] = Entities.INVALID_ID;

        this.freeRefs.push(storageEntryRef);
    }

    public isMatching(componentIds: ComponentId[]): boolean {
        if (this.components.size !== componentIds.length) {
            return false;
        }

        for (const compId of componentIds) {
            if (!this.components.has(compId)) {
                return false;
            }
        }

        return true;
    }

    public recycleOrCreateEntry(entityId: EntityId): EntityComponentSetStorageEntryRef {
        // Try to reuse a free entry
        const nextRef = this.freeRefs.pop();

        if (nextRef === undefined) {
            // No free entries
            return this.createEntry(entityId);
        }

        this.entityIds[nextRef] = entityId;

        return nextRef;
    }

    public setComponent(storageEntryRef: EntityComponentSetStorageEntryRef, value: Component): void {
        const compContainer = this.components.get(value.componentId);
        assertDebug(compContainer !== undefined, "Container must not be undefined");
        compContainer[storageEntryRef] = value;
    }
}

export class EntityComponentIterator<T extends Component> implements EntityComponentIterator<T> {
    private currComponentStates: ComponentStates;
    private currComponents: ReadonlyMap<ComponentId, ComponentContainer>;
    private currEntityFlags: EntityFlags;
    private currEntityIds: ReadonlyArray<EntityId>;
    private currQuerySetIdx: number;
    private currQuerySetMaxLength: number;
    private currSetEntryRef: EntityComponentSetEntryRef;
    private currStorageEntryRef: EntityComponentSetStorageEntryRef;
    private currStorageEntryRefs: ReadonlyArray<EntityComponentSetStorageEntryRef>;
    private querySets: ReadonlyArray<EntityComponentQuerySet>;

    public constructor(querySets: EntityComponentQuerySet[]) {
        this.querySets = querySets;

        this.currComponentStates = EMPTY_MAP;
        this.currComponents = EMPTY_MAP;
        this.currEntityFlags = EntityFlags.NONE;
        this.currEntityIds = EMPTY_ARRAY;
        this.currQuerySetIdx = -1;
        this.currQuerySetMaxLength = 0;
        this.currSetEntryRef = -1;
        this.currStorageEntryRef = -1;
        this.currStorageEntryRefs = EMPTY_ARRAY;
    }

    public findComponent<U extends Component>(componentId: ComponentIdOf<U>): U | undefined {
        const comps = this.currComponents.get(componentId);

        if (comps === undefined) {
            return undefined;
        }

        const comp = comps[this.currStorageEntryRef];

        if (comp === null) {
            return undefined;
        }

        return comp as U;
    }

    public getComponent<U extends T>(componentId: ComponentIdOf<U>): U {
        const comps = this.currComponents.get(componentId);

        if (comps === undefined) {
            throwError("Component id '{}' not found", componentId);
        }

        const comp = comps[this.currStorageEntryRef];

        if (comp === null) {
            throwError("Invalid storage ref '{}'", this.currStorageEntryRef);
        }

        return comp as U;
    }

    public getComponentFlags<U extends Component>(componentId: ComponentIdOf<U>): ComponentFlags {
        const compState = this.currComponentStates.get(componentId);

        if (compState === undefined) {
            return ComponentFlags.NONE;
        }

        return compState.flags;
    }

    public getEntityFlags(): EntityFlags {
        return this.currEntityFlags;
    }

    public getEntityId(): EntityId {
        const id = this.currEntityIds[this.currStorageEntryRef];

        if (id < 0) {
            throwError("Invalid storage ref '{}'", this.currStorageEntryRef);
        }

        return id;
    }

    public hasComponent<U extends Component>(componentId: ComponentIdOf<U>): boolean {
        const flags = this.getComponentFlags(componentId);
        return hasFlagsAny(flags, ComponentFlags.DEFAULT | ComponentFlags.ADDED | ComponentFlags.UPDATED);
    }

    public hasComponentFlags<U extends Component>(componentId: ComponentIdOf<U>, flagMask: ComponentFlags): boolean {
        const flags = this.getComponentFlags(componentId);
        return hasFlags(flags, flagMask);
    }

    public hasComponentFlagsAny<U extends Component>(componentId: ComponentIdOf<U>, flagMask: ComponentFlags): boolean {
        const flags = this.getComponentFlags(componentId);
        return hasFlagsAny(flags, flagMask);
    }

    public hasEntityFlags(flagMask: EntityFlags): boolean {
        return hasFlags(this.currEntityFlags, flagMask);
    }

    public hasEntityFlagsAny(flagMask: EntityFlags): boolean {
        return hasFlagsAny(this.currEntityFlags, flagMask);
    }

    public isEntityAlive(): boolean {
        return hasFlagsAny(this.currEntityFlags, EntityFlags.DEFAULT | EntityFlags.CREATED);
    }

    public next(): boolean {
        let nextSetEntryRef = this.currSetEntryRef + 1;

        while (nextSetEntryRef < this.currQuerySetMaxLength) {
            const nextStorageEntryRef = this.currStorageEntryRefs[nextSetEntryRef];

            if (nextStorageEntryRef >= 0) {
                this.currSetEntryRef = nextSetEntryRef;
                this.currStorageEntryRef = nextStorageEntryRef;

                return true;
            }

            nextSetEntryRef += 1;
        }

        return this.nextStorage();
    }

    public toEntityIdArray(): EntityId[] {
        const ids: EntityId[] = [];

        while (this.next()) {
            ids.push(this.getEntityId());
        }

        return ids;
    }

    private nextStorage(): boolean {
        let nextSetIdx = this.currQuerySetIdx + 1;

        while (nextSetIdx < this.querySets.length) {
            const querySet = this.querySets[nextSetIdx];
            const componentSet = querySet.componentSet;

            let nextSetEntryRef = 0;

            while (nextSetEntryRef < querySet.maxLength) {
                const nextStorageEntryRef = componentSet.storageEntryRefs[nextSetEntryRef];

                if (nextStorageEntryRef >= 0) {
                    this.currQuerySetIdx = nextSetIdx;
                    this.currQuerySetMaxLength = querySet.maxLength;

                    this.currSetEntryRef = nextSetEntryRef;
                    this.currStorageEntryRef = nextStorageEntryRef;

                    this.currStorageEntryRefs = componentSet.storageEntryRefs;
                    this.currEntityFlags = componentSet.state.entityState.flags;
                    this.currComponentStates = componentSet.state.componentStates;
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

function hasFlags<T extends number>(flags: T, flagMask: T): boolean {
    return (flags & flagMask) === flagMask;
}

function hasFlagsAny<T extends number>(flags: T, flagMask: T): boolean {
    return (flags & flagMask) !== 0;
}
