import { assert, throwError } from "redgeometry/src/internal/debug";
import { log } from "redgeometry/src/internal/log";
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

type SystemNode = {
    depsAsync: SystemScheduleEntry[];
    depsIn: Set<SystemNode>;
    depsOut: Set<SystemNode>;
    options: SystemOptions;
    scheduleId: SystemScheduleId;
};

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
            const nodes = this.createNodes(scheduleId);
            const entries = this.createEntries(nodes);

            this.validateNodes(scheduleId, nodes);

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

    private createEntries(nodes: SystemNode[]): SystemScheduleEntry[] {
        // Kahn's algorithm: We need to sort the nodes topologically to create the schedule
        const entries: SystemScheduleEntry[] = [];

        // Create a queue and initialize it with nodes that have no incoming dependencies
        const queue: SystemNode[] = [];

        for (const node of nodes) {
            if (node.depsIn.size === 0) {
                queue.push(node);
            }
        }

        let node = queue.shift();

        while (node !== undefined) {
            const entry: SystemScheduleEntry = {
                depsAsync: node.depsAsync,
                options: node.options,
                promise: undefined,
            };

            for (const nodeDep of node.depsOut) {
                node.depsOut.delete(nodeDep);
                nodeDep.depsIn.delete(node);

                if (node.options.type === "async") {
                    nodeDep.depsAsync.push(entry);
                }

                if (nodeDep.depsIn.size === 0) {
                    queue.push(nodeDep);
                }
            }

            entries.push(entry);

            node = queue.shift();
        }

        return entries;
    }

    private createNodes(scheduleId: SystemScheduleId): SystemNode[] {
        const nodes: SystemNode[] = [];

        for (const entry of this.systemEntries) {
            if (entry.scheduleId !== scheduleId) {
                continue;
            }

            nodes.push({
                depsAsync: [],
                depsIn: new Set(),
                depsOut: new Set(),
                options: entry.options,
                scheduleId: entry.scheduleId,
            });
        }

        for (const entry of this.systemDependencyEntries) {
            if (entry.scheduleId !== scheduleId) {
                continue;
            }

            for (let i = 1; i < entry.options.length; i++) {
                const elementsA = entry.options[i - 1];
                const elementsB = entry.options[i];

                this.linkDependencyElements(nodes, elementsA, elementsB);
            }
        }

        return nodes;
    }

    private findNode(nodes: SystemNode[], dep: SystemDependencyElementSystem): SystemNode | undefined {
        let foundNodeDep = undefined;
        let foundCount = 0;

        // Find all nodes with the id
        for (const nodeDep of nodes) {
            if (nodeDep.options.id === dep.id) {
                foundNodeDep = nodeDep;
                foundCount += 1;
            }
        }

        if (foundNodeDep !== undefined && foundCount === 1) {
            return foundNodeDep;
        } else if (foundCount > 1) {
            log.error("Ambiguous system dependency '{}' found", dep);
            return undefined;
        } else {
            log.error("Missing system dependency '{}' ", dep);
            return undefined;
        }
    }

    private linkDependencyElements(
        nodes: SystemNode[],
        elementsA: SystemDependencyElement,
        elementsB: SystemDependencyElement,
    ) {
        // Flatten
        const depsA = Array.isArray(elementsA) ? elementsA : [elementsA];
        const depsB = Array.isArray(elementsB) ? elementsB : [elementsB];

        for (let i = 0; i < depsA.length; i++) {
            for (let j = 0; j < depsB.length; j++) {
                const depA = depsA[i];
                const depB = depsB[j];

                // TODO: Find common parent node to allow system groups
                assert(depA.type === "system" && depB.type === "system");

                const node0 = this.findNode(nodes, depA);
                const node1 = this.findNode(nodes, depB);

                if (node0 !== undefined && node1 !== undefined) {
                    node0.depsOut.add(node1);
                    node1.depsIn.add(node0);
                }
            }
        }
    }

    private validateNodes(scheduleId: SystemScheduleId, nodes: SystemNode[]) {
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
                nodeDepsStr += "\n  " + node.options.id + " -> " + nodeDep.options.id;
            }
        }

        throwError("At least one system cycle was found in system schedule '{}':{}", scheduleId, nodeDepsStr);
    }
}
