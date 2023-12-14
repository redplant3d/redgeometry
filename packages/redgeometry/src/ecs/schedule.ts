import { assertDebug, log } from "../utility/debug.js";
import type { System, SystemDependency, SystemOptions } from "./types.js";
import type { World } from "./world.js";

export type ScheduleEntry = {
    depsAsync: ScheduleEntry[];
    idx: number;
    options: SystemOptions;
    promise: Promise<void> | undefined;
};

type SystemDependencyError = {
    dep: SystemDependency;
    fn: System;
    reason: "missing" | "ambiguous";
};

type SystemNode = {
    depsAsync: ScheduleEntry[];
    depsIn: Set<number>;
    depsOut: Set<number>;
    errors: SystemDependencyError[];
    idx: number;
    options: SystemOptions;
};

export class SystemSchedule {
    private deps: SystemDependency[];
    private entries: ScheduleEntry[];
    private options: SystemOptions[];

    public constructor() {
        this.deps = [];
        this.entries = [];
        this.options = [];
    }

    public addDepedency(dep: SystemDependency): void {
        this.deps.push(dep);
    }

    public addSystem(options: SystemOptions): void {
        this.options.push(options);
    }

    public clear(): void {
        this.deps = [];
        this.entries = [];
        this.options = [];
    }

    public async executeSystems(world: World): Promise<void> {
        for (const entry of this.entries) {
            const { fn, args, mode } = entry.options;

            // Wait for incoming dependencies
            for (const depAsync of entry.depsAsync) {
                if (depAsync.promise !== undefined) {
                    // log.infoDebug("Waiting for system '{}'", depAsync.options.fn.name);
                    await depAsync.promise;
                    depAsync.promise = undefined;
                }
            }

            // Call system
            if (mode === "async") {
                if (args !== undefined) {
                    entry.promise = fn(world, ...args) as Promise<void>;
                } else {
                    entry.promise = fn(world) as Promise<void>;
                }
            } else {
                if (args !== undefined) {
                    fn(world, ...args);
                } else {
                    fn(world);
                }
            }
        }
    }

    public toString(): string {
        let str = "";

        for (let i = 0; i < this.entries.length; i++) {
            const entry = this.entries[i];
            const mode = entry.options.mode ?? "sync";
            const name = entry.options.fn.name;
            const idx = entry.idx;

            str += `#${i} - ${name} (#${idx}, ${mode})\n`;

            for (const dep of entry.depsAsync) {
                str += `    ^ ${dep.options.fn.name}\n`;
            }
        }

        return str;
    }

    public update(): void {
        const nodes = this.createNodes();
        const errors = this.connectNodes(nodes);

        if (errors.length === 0) {
            this.createEntries(nodes);
        } else {
            this.reportDependencyErrors(errors);
        }
    }

    private connectNodes(nodes: SystemNode[]): SystemDependencyError[] {
        const errors: SystemDependencyError[] = [];

        for (const dep of this.deps) {
            let depErrorCount = 0;

            const seqNodes: SystemNode[] = [];

            // Iterate seqeuence and collect errors
            for (const fn of dep.seq) {
                let foundNodeDep = undefined;
                let foundCount = 0;

                for (const nodeDep of nodes) {
                    if (nodeDep.options.fn === fn) {
                        foundNodeDep = nodeDep;
                        foundCount += 1;
                    }
                }

                if (foundNodeDep !== undefined && foundCount === 1) {
                    seqNodes.push(foundNodeDep);
                } else if (foundCount > 1) {
                    errors.push({ dep, fn, reason: "ambiguous" });
                    depErrorCount += 1;
                } else if (dep.optional !== true) {
                    errors.push({ dep, fn, reason: "missing" });
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
                node0.depsOut.add(node1.idx);
                node1.depsIn.add(node0.idx);
            }
        }

        return errors;
    }

    private createEntries(nodes: SystemNode[]): void {
        // Kahn's algorithm: We need to sort the nodes topologically to create the schedule
        const entries: ScheduleEntry[] = [];

        // Create a queue and initialize it with nodes that have no incoming dependencies
        const queue: SystemNode[] = [];

        for (const node of nodes) {
            if (node.depsIn.size === 0) {
                queue.push(node);
            }
        }

        let node = queue.shift();

        while (node !== undefined) {
            const entry: ScheduleEntry = {
                depsAsync: node.depsAsync,
                idx: node.idx,
                options: node.options,
                promise: undefined,
            };

            for (const nodeDepIdx of node.depsOut) {
                const nodeDep = nodes[nodeDepIdx];

                node.depsOut.delete(nodeDepIdx);
                nodeDep.depsIn.delete(node.idx);

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
            assertDebug(node.depsIn.size === 0);
            assertDebug(node.depsOut.size === 0);
        }

        this.entries = entries;
    }

    private createNodes(): SystemNode[] {
        const nodes: SystemNode[] = [];

        for (let i = 0; i < this.options.length; i++) {
            nodes.push({
                idx: i,
                options: this.options[i],
                depsIn: new Set(),
                depsOut: new Set(),
                errors: [],
                depsAsync: [],
            });
        }

        return nodes;
    }

    private reportDependencyErrors(errors: SystemDependencyError[]): void {
        for (const error of errors) {
            switch (error.reason) {
                case "missing": {
                    log.error("Missing system dependency '{}' ", error.fn.name);
                    break;
                }
                case "ambiguous": {
                    log.error("Ambiguous system dependency '{}' found", error.fn.name);
                    break;
                }
            }
        }
    }
}
