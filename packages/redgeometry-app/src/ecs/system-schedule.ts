import { assert, assertUnreachable, throwError } from "redgeometry/src/internal/debug";
import type {
    World,
    WorldContextRegisterScheduleEntry,
    WorldContextRegisterSystemDependencyEntry,
    WorldContextRegisterSystemEntry,
    WorldContextRegisterSystemGroupEntry,
    WorldModuleId,
} from "./world.ts";

export type SystemId = string;
export type SystemGroupId = string;
export type SystemScheduleId = string;
export type SystemDependencyId = string;

export type SystemOptionsSync = {
    type: "sync";
    id: SystemId;
    fn: (world: World) => void;
    groupId?: SystemGroupId;
};
export type SystemOptionsAsync = {
    type: "async";
    id: SystemId;
    fn: (world: World) => Promise<void>;
    groupId?: SystemGroupId;
};
export type SystemOptions = SystemOptionsSync | SystemOptionsAsync;

export type SystemDependencyArray<T> = [T, T, ...T[]];

export type SystemDependencyElementSystem = {
    type: "system";
    id: SystemId;
};
export type SystemDependencyElementSystemGroup = {
    type: "system-group";
    id: SystemGroupId;
};

export type SystemDependencyElementCollection = SystemDependencyArray<
    SystemDependencyElementSystem | SystemDependencyElementSystemGroup
>;

export type SystemDependencyElement =
    SystemDependencyElementSystem | SystemDependencyElementSystemGroup | SystemDependencyElementCollection;

export type SystemDependencyOptions = SystemDependencyArray<SystemDependencyElement>;

export type SystemGroupOptions = {
    id: SystemGroupId;
    parentId?: SystemGroupId;
};

type SystemScheduleEntry = {
    depsAsync: SystemScheduleEntry[];
    options: SystemOptions;
    promise: Promise<void> | undefined;
};

type SystemEntryNode = {
    type: "system-entry";
    id: SystemId;
    depsIn: Set<SystemNode>;
    depsOut: Set<SystemNode>;
    parentGroupId: SystemGroupId | undefined;
    scheduleEntry: SystemScheduleEntry;
};
type SystemGroupEntryNode = {
    type: "system-group-entry";
    id: SystemGroupId | undefined;
    depsIn: Set<SystemNode>;
    depsOut: Set<SystemNode>;
    parentGroupId: SystemGroupId | undefined;
    subNodes: SystemNode[];
};

type SystemNode = SystemEntryNode | SystemGroupEntryNode;

type SystemSchedule = {
    entries: SystemScheduleEntry[];
};

export class SystemScheduleStorage {
    public schedules: Map<SystemScheduleId, SystemSchedule | undefined>;
    public systemDependencyEntries: WorldContextRegisterSystemDependencyEntry[];
    public systemEntries: WorldContextRegisterSystemEntry[];
    public systemGroupEntries: WorldContextRegisterSystemGroupEntry[];

    constructor() {
        this.schedules = new Map();
        this.systemDependencyEntries = [];
        this.systemEntries = [];
        this.systemGroupEntries = [];
    }

    public clear(): void {
        this.schedules = new Map();
        this.systemDependencyEntries = [];
        this.systemEntries = [];
        this.systemGroupEntries = [];
    }

    public hasSchedule(scheduleId: SystemScheduleId): boolean {
        return this.schedules.has(scheduleId);
    }

    public initialize(): void {
        for (const scheduleId of this.schedules.keys()) {
            const rootGroupEntryNode: SystemGroupEntryNode = {
                type: "system-group-entry",
                id: undefined,
                depsIn: new Set(),
                depsOut: new Set(),
                parentGroupId: undefined,
                subNodes: [],
            };

            const groupEntryNodes = this.createGroupEntryNodes(scheduleId, rootGroupEntryNode);
            const entryNodes = this.createEntryNodes(scheduleId, groupEntryNodes);

            this.addNodeDepedencies(scheduleId, groupEntryNodes, entryNodes);
            this.sortGroupEntryNodes(scheduleId, groupEntryNodes);

            const entries: SystemScheduleEntry[] = [];

            this.addScheduleEntries(rootGroupEntryNode, entries);

            this.schedules.set(scheduleId, { entries });
        }
    }

    public printSchedules(): string {
        let str = "";

        for (const [scheduleId, schedule] of this.schedules) {
            if (schedule === undefined) {
                continue;
            }

            str += "*** " + scheduleId + " ***\n";

            for (let i = 0; i < schedule.entries.length; i++) {
                const entry = schedule.entries[i];
                const type = entry.options.type;
                const id = entry.options.id;

                str += "#" + i + " " + id + " (" + type + ")\n";

                for (const dep of entry.depsAsync) {
                    str += "  ^ " + dep.options.id + "\n";
                }
            }

            str += "\n";
        }

        return str;
    }

    public registerSchedule(entry: WorldContextRegisterScheduleEntry, moduleId: WorldModuleId): void {
        assert(
            !this.schedules.has(entry.scheduleId),
            "System schedule '{}' is registered from world module '{}' but has already been registered",
            entry.scheduleId,
            moduleId,
        );

        this.schedules.set(entry.scheduleId, undefined);
    }

    public registerSystem(entry: WorldContextRegisterSystemEntry, moduleId: WorldModuleId): void {
        assert(
            this.schedules.has(entry.scheduleId),
            "System schedule '{}' is required for system '{}' by world module '{}' but has not been registered",
            entry.scheduleId,
            entry.options.id,
            moduleId,
        );
        assert(
            !this.systemEntries.some((e) => e.options.id === entry.options.id && e.scheduleId === entry.scheduleId),
            "System '{}' in system schedule '{}' is registered from world module '{}' but has already been registered",
            entry.options.id,
            entry.scheduleId,
            moduleId,
        );

        this.systemEntries.push(entry);
    }

    public registerSystemDependency(entry: WorldContextRegisterSystemDependencyEntry, moduleId: WorldModuleId): void {
        assert(
            this.schedules.has(entry.scheduleId),
            "System schedule '{}' is required for a system dependency by world module '{}' but has not been registered",
            entry.scheduleId,
            moduleId,
        );

        this.systemDependencyEntries.push(entry);
    }

    public registerSystemGroup(entry: WorldContextRegisterSystemGroupEntry, moduleId: WorldModuleId): void {
        assert(
            this.schedules.has(entry.scheduleId),
            "System schedule '{}' is required for a system group by world module '{}' but has not been registered",
            entry.scheduleId,
            moduleId,
        );

        this.systemGroupEntries.push(entry);
    }

    public async runSchedule(id: SystemScheduleId, world: World): Promise<void> {
        const schedule = this.schedules.get(id);
        assert(schedule !== undefined, "System schedule '{}' is not available", id);

        for (const entry of schedule.entries) {
            // Wait for incoming dependencies
            for (const dep of entry.depsAsync) {
                if (dep.promise !== undefined) {
                    await dep.promise;
                    dep.promise = undefined;
                }
            }

            // Call system
            if (entry.options.type === "async") {
                entry.promise = entry.options.fn(world);
            } else {
                entry.options.fn(world);
            }
        }
    }

    private addNodeDepedencies(
        scheduleId: SystemScheduleId,
        groupEntryNodes: Map<SystemGroupId | undefined, SystemGroupEntryNode>,
        entryNodes: Map<SystemId | undefined, SystemEntryNode>,
    ) {
        // Add dependencies between nodes
        for (const dependencyEntry of this.systemDependencyEntries) {
            if (dependencyEntry.scheduleId !== scheduleId) {
                continue;
            }

            for (let i = 1; i < dependencyEntry.options.length; i++) {
                const elementsA = dependencyEntry.options[i - 1];
                const elementsB = dependencyEntry.options[i];

                // Flatten
                const elementsArrayA = Array.isArray(elementsA) ? elementsA : [elementsA];
                const elementsArrayB = Array.isArray(elementsB) ? elementsB : [elementsB];

                for (let i = 0; i < elementsArrayA.length; i++) {
                    for (let j = 0; j < elementsArrayB.length; j++) {
                        const nodeA = this.findNode(groupEntryNodes, entryNodes, elementsArrayA[i]);
                        const nodeB = this.findNode(groupEntryNodes, entryNodes, elementsArrayB[j]);

                        // TODO: Implement LCA algorithm
                        assert(
                            nodeA.parentGroupId === nodeB.parentGroupId,
                            "System dependencies must be defined within the same group",
                        );

                        if (
                            nodeA.type === "system-entry" &&
                            nodeB.type === "system-entry" &&
                            nodeA.scheduleEntry.options.type === "async"
                        ) {
                            nodeB.scheduleEntry.depsAsync.push(nodeA.scheduleEntry);
                        }

                        nodeA.depsOut.add(nodeB);
                        nodeB.depsIn.add(nodeA);
                    }
                }
            }
        }
    }

    private addScheduleEntries(groupEntryNode: SystemGroupEntryNode, outScheduleEntries: SystemScheduleEntry[]): void {
        for (const node of groupEntryNode.subNodes) {
            switch (node.type) {
                case "system-entry": {
                    outScheduleEntries.push(node.scheduleEntry);
                    break;
                }
                case "system-group-entry": {
                    this.addScheduleEntries(node, outScheduleEntries);
                    break;
                }
                default: {
                    assertUnreachable(node);
                }
            }
        }
    }

    private createEntryNodes(
        scheduleId: SystemScheduleId,
        groupEntryNodes: Map<SystemGroupId | undefined, SystemGroupEntryNode>,
    ): Map<SystemId, SystemEntryNode> {
        const entryNodes = new Map<SystemId, SystemEntryNode>();

        // Add system dependency nodes to parent group nodes
        for (const entry of this.systemEntries) {
            if (entry.scheduleId !== scheduleId) {
                continue;
            }

            const groupEntryNode = groupEntryNodes.get(entry.options.groupId);
            assert(groupEntryNode !== undefined);

            const entryNode: SystemEntryNode = {
                type: "system-entry",
                id: entry.options.id,
                depsIn: new Set(),
                depsOut: new Set(),
                scheduleEntry: {
                    depsAsync: [],
                    options: entry.options,
                    promise: undefined,
                },
                parentGroupId: entry.options.groupId,
            };
            entryNodes.set(entry.options.id, entryNode);
            groupEntryNode.subNodes.push(entryNode);
        }

        return entryNodes;
    }

    private createGroupEntryNodes(
        scheduleId: SystemScheduleId,
        rootGroupEntryNode: SystemGroupEntryNode,
    ): Map<SystemGroupId | undefined, SystemGroupEntryNode> {
        const groupEntryNodes = new Map<SystemGroupId | undefined, SystemGroupEntryNode>();
        groupEntryNodes.set(undefined, rootGroupEntryNode);

        for (const groupEntry of this.systemGroupEntries) {
            if (groupEntry.scheduleId !== scheduleId) {
                continue;
            }

            const groupEntryNode: SystemGroupEntryNode = {
                type: "system-group-entry",
                id: groupEntry.options.id,
                depsIn: new Set(),
                depsOut: new Set(),
                parentGroupId: groupEntry.options.parentId,
                subNodes: [],
            };
            groupEntryNodes.set(groupEntry.options.id, groupEntryNode);
        }

        for (const groupEntry of this.systemGroupEntries) {
            if (groupEntry.scheduleId !== scheduleId) {
                continue;
            }

            const groupEntryNode = groupEntryNodes.get(groupEntry.options.parentId);
            const groupEntrySubNode = groupEntryNodes.get(groupEntry.options.id);
            assert(groupEntryNode !== undefined && groupEntrySubNode !== undefined);

            groupEntryNode.subNodes.push(groupEntrySubNode);
        }

        return groupEntryNodes;
    }

    private findNode(
        groupEntryNodes: Map<SystemGroupId | undefined, SystemGroupEntryNode>,
        entryNodes: Map<SystemId | undefined, SystemEntryNode>,
        element: SystemDependencyElementSystem | SystemDependencyElementSystemGroup,
    ): SystemNode {
        switch (element.type) {
            case "system": {
                const node = entryNodes.get(element.id);
                assert(node !== undefined, "System '{}' required as a dependency but is missing", element.id);

                return node;
            }
            case "system-group": {
                const node = groupEntryNodes.get(element.id);
                assert(node !== undefined, "System group '{}' required as a dependency but is missing", element.id);

                return node;
            }
            default: {
                assertUnreachable(element);
            }
        }
    }

    private sortGroupEntryNodes(
        scheduleId: SystemScheduleId,
        groupEntryNodes: Map<SystemGroupId | undefined, SystemGroupEntryNode>,
    ): void {
        for (const groupEntryNode of groupEntryNodes.values()) {
            // Kahn's algorithm: We need to sort the nodes topologically to create the schedule
            const subNodesSorted: SystemNode[] = [];

            // Create a queue and initialize it with nodes that have no incoming dependencies
            const nodeQueue: SystemNode[] = [];

            for (const node of groupEntryNode.subNodes) {
                if (node.depsIn.size === 0) {
                    nodeQueue.push(node);
                }
            }

            let node = nodeQueue.shift();

            while (node !== undefined) {
                for (const nodeDep of node.depsOut) {
                    node.depsOut.delete(nodeDep);
                    nodeDep.depsIn.delete(node);

                    if (nodeDep.depsIn.size === 0) {
                        nodeQueue.push(nodeDep);
                    }
                }

                subNodesSorted.push(node);

                node = nodeQueue.shift();
            }

            this.validateNodes(scheduleId, subNodesSorted);

            groupEntryNode.subNodes = subNodesSorted;
        }
    }

    private validateNodes(scheduleId: SystemScheduleId, nodes: SystemNode[]): void {
        let foundCycle = false;

        for (const node of nodes) {
            if (node.depsIn.size > 0 || node.depsOut.size > 0) {
                foundCycle = true;
                break;
            }
        }

        if (!foundCycle) {
            return;
        }

        let nodeDepsStr = "";

        for (const node of nodes) {
            // We don't need to go over both `depsOut` and `depsIn` (otherwise every dependency would be duplicate)
            for (const nodeDep of node.depsOut) {
                nodeDepsStr += "\n  " + node.id + " -> " + nodeDep.id;
            }
        }

        throwError("At least one system cycle was found in system schedule '{}':{}", scheduleId, nodeDepsStr);
    }
}
