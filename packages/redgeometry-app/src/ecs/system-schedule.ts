import { assert, throwError } from "redgeometry/src/internal/debug";
import { log } from "redgeometry/src/internal/log";
import type { World, WorldModuleId } from "./world.ts";

export type SystemId = string;
export type SystemScheduleId = string;

export type SystemOptionsSync = {
    id: SystemId;
    fn: (world: World) => void;
    mode: "sync";
    scheduleId: SystemScheduleId;
};
export type SystemOptionsAsync = {
    id: SystemId;
    fn: (world: World) => Promise<void>;
    mode: "async";
    scheduleId: SystemScheduleId;
};
export type SystemOptions = SystemOptionsSync | SystemOptionsAsync;

export type SystemDependencyOptions = {
    seq: [SystemId, ...SystemId[]];
    scheduleId: SystemScheduleId;
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
};

type SystemSchedule = {
    entries: SystemScheduleEntry[];
};

export class SystemScheduleStorage {
    public options: SystemOptions[];
    public dependencyOptions: SystemDependencyOptions[];
    public schedules: Map<SystemScheduleId, SystemSchedule | undefined>;

    constructor() {
        this.dependencyOptions = [];
        this.options = [];
        this.schedules = new Map();
    }

    public clear(): void {
        this.dependencyOptions = [];
        this.options = [];
        this.schedules = new Map();
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
                const mode = entry.options.mode;
                const id = entry.options.id;

                str += "#" + i + " " + id + " (" + mode + ")\n";

                for (const dep of entry.depsAsync) {
                    str += "  ^ " + dep.options.id + "\n";
                }
            }

            str += "\n";
        }

        return str;
    }

    public registerSchedule(scheduleId: SystemScheduleId, moduleId: WorldModuleId): void {
        assert(
            !this.schedules.has(scheduleId),
            "System schedule id '{}' is registered in world module id '{}' " +
                "but has already been registered in a world module",
            scheduleId,
            moduleId,
        );

        this.schedules.set(scheduleId, undefined);
    }

    public registerSystem(options: SystemOptions, moduleId: WorldModuleId): void {
        assert(
            this.schedules.has(options.scheduleId),
            "System schedule id '{}' is required for system id '{}' in world module id '{}' " +
                "but has not been registered in a world module",
            options.scheduleId,
            options.id,
            moduleId,
        );
        assert(
            !this.options.some((o) => o.id === options.id && o.scheduleId === options.scheduleId),
            "System id '{}' is registered in world module id '{}' " +
                "but has already been registered in a world module",
            options.id,
            moduleId,
        );

        this.options.push(options);
    }

    public registerSystemDependency(options: SystemDependencyOptions, moduleId: WorldModuleId): void {
        assert(
            this.schedules.has(options.scheduleId),
            "System schedule id '{}' is required for a system dependency in world module id '{}' " +
                "but has not been registered in a world module",
            options.scheduleId,
            moduleId,
        );

        this.dependencyOptions.push(options);
    }

    public async runSchedule(id: SystemScheduleId, world: World): Promise<void> {
        const schedule = this.schedules.get(id);
        assert(schedule !== undefined, "System schedule id '{}' has not been registered in a world module", id);

        for (const entry of schedule.entries) {
            // Wait for incoming dependencies
            for (const dep of entry.depsAsync) {
                if (dep.promise !== undefined) {
                    await dep.promise;
                    dep.promise = undefined;
                }
            }

            // Call system
            if (entry.options.mode === "async") {
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

                if (node.options.mode === "async") {
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

        for (const options of this.options) {
            if (options.scheduleId !== scheduleId) {
                continue;
            }

            nodes.push({
                options,
                depsIn: new Set(),
                depsOut: new Set(),
                depsAsync: [],
            });
        }

        for (const options of this.dependencyOptions) {
            if (options.scheduleId !== scheduleId) {
                continue;
            }

            let depErrorCount = 0;

            const seqNodes: SystemNode[] = [];

            // Iterate seqeuence and collect errors
            for (const id of options.seq) {
                let foundNodeDep = undefined;
                let foundCount = 0;

                for (const nodeDep of nodes) {
                    if (nodeDep.options.id === id) {
                        foundNodeDep = nodeDep;
                        foundCount += 1;
                    }
                }

                if (foundNodeDep !== undefined && foundCount === 1) {
                    seqNodes.push(foundNodeDep);
                } else if (foundCount > 1) {
                    log.error("Ambiguous system dependency '{}' found", id);
                    depErrorCount += 1;
                } else {
                    log.error("Missing system dependency '{}' ", id);
                    depErrorCount += 1;
                }
            }

            if (depErrorCount > 0) {
                continue;
            }

            // Connect nodes
            for (let i = 1; i < seqNodes.length; i++) {
                const node0 = seqNodes[i - 1];
                const node1 = seqNodes[i - 0];
                node0.depsOut.add(node1);
                node1.depsIn.add(node0);
            }
        }

        return nodes;
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

        throwError("At least one system cycle was found in system schedule id '{}':{}", scheduleId, nodeDepsStr);
    }
}
