import { log } from "redgeometry/src/internal/log";
import { assert } from "redgeometry/src/utility/debug";
import type { World } from "./world.ts";

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
    idx: number;
    options: SystemOptions;
    promise: Promise<void> | undefined;
};

type SystemNode = {
    depsAsync: SystemScheduleEntry[];
    depsIn: Set<number>;
    depsOut: Set<number>;
    idx: number;
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

            this.schedules.set(scheduleId, { entries });
        }
    }

    public registerSchedule(scheduleId: SystemScheduleId): void {
        const hasSchedule = this.schedules.has(scheduleId);
        assert(!hasSchedule, "System schedule id '{}' is already registered", scheduleId);

        this.schedules.set(scheduleId, undefined);
    }

    public registerSystem(options: SystemOptions): void {
        const hasSchedule = this.schedules.has(options.scheduleId);
        assert(hasSchedule, "System schedule id '{}' is required but missing", options.scheduleId);

        const hasSystem = this.options.some((o) => o.id === options.id && o.scheduleId === options.scheduleId);
        assert(!hasSystem, "System id '{}' is already registered", options.id);

        this.options.push(options);
    }

    public registerSystemDependency(options: SystemDependencyOptions): void {
        const hasSchedule = this.schedules.has(options.scheduleId);
        assert(hasSchedule, "System schedule id '{}' is required but missing", options.scheduleId);

        this.dependencyOptions.push(options);
    }

    public async runSchedule(id: SystemScheduleId, world: World): Promise<void> {
        const schedule = this.schedules.get(id);
        assert(schedule !== undefined, "System schedule id '{}' not found", id);

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
                const idx = entry.idx;

                str += "#" + i + " - " + id + " (#" + idx + ", " + mode + ")\n";

                for (const dep of entry.depsAsync) {
                    str += "    ^ " + dep.options.fn.name + "\n";
                }
            }

            str += "\n";
        }

        return str;
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
                idx: node.idx,
                options: node.options,
                promise: undefined,
            };

            for (const nodeDepIdx of node.depsOut) {
                const nodeDep = nodes[nodeDepIdx];
                const nodeIdx = nodes.indexOf(node);

                node.depsOut.delete(nodeDepIdx);
                nodeDep.depsIn.delete(nodeIdx);

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

        // TODO: Better reporting of cycles
        for (const node of nodes) {
            assert(node.depsIn.size === 0);
            assert(node.depsOut.size === 0);
        }

        return entries;
    }

    private createNodes(scheduleId: SystemScheduleId): SystemNode[] {
        const nodes: SystemNode[] = [];

        for (let i = 0; i < this.options.length; i++) {
            const options = this.options[i];

            if (options.scheduleId !== scheduleId) {
                continue;
            }

            nodes.push({
                idx: i,
                options: this.options[i],
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
                const nodeIdx0 = nodes.indexOf(node0);
                const nodeIdx1 = nodes.indexOf(node1);
                node0.depsOut.add(nodeIdx1);
                node1.depsIn.add(nodeIdx0);
            }
        }

        return nodes;
    }
}
