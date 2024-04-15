import { assertDebug, log } from "redgeometry/src/utility/debug";
import type {
    System,
    SystemArgs,
    SystemAsync,
    SystemStage,
    SystemSync,
    SystemWithArgsAsync,
    SystemWithArgsSync,
} from "./types.js";
import type { World } from "./world.js";

export type SystemAwaitMode = "none" | "dependency";

export type SystemOptions<T extends SystemStage> = {
    stage: T;
    fn: SystemSync | SystemAsync;
    awaitMode?: SystemAwaitMode;
};

export type SystemWithArgsOptions<T extends SystemStage, U extends SystemArgs> = {
    stage: T;
    fn: SystemWithArgsSync<U> | SystemWithArgsAsync<U>;
    args: U;
    awaitMode?: SystemAwaitMode;
};

export type SystemsOptions<T = SystemStage> = {
    stage: T;
    fns: (SystemSync | SystemAsync)[];
};

export type SystemDependencyOptions<T = SystemStage> = {
    stage: T;
    seq: [System, System, ...System[]];
    optional?: boolean;
};

type SystemOptionsEntry =
    | (SystemOptions<SystemStage> & { args: undefined })
    | SystemWithArgsOptions<SystemStage, SystemArgs>;

type SystemScheduleEntry = {
    depsAsync: SystemScheduleEntry[];
    idx: number;
    options: SystemOptionsEntry;
    promise: Promise<void> | undefined;
};

type SystemDependencyError = {
    dep: SystemDependencyOptions;
    fn: System;
    reason: "missing" | "ambiguous";
};

type SystemNode = {
    depsAsync: SystemScheduleEntry[];
    depsIn: Set<number>;
    depsOut: Set<number>;
    idx: number;
    options: SystemOptionsEntry;
};

export class SystemSchedule {
    private deps: SystemDependencyOptions[];
    private entries: SystemScheduleEntry[];
    private options: SystemOptionsEntry[];

    public constructor() {
        this.deps = [];
        this.entries = [];
        this.options = [];
    }

    public addDepedency(dep: SystemDependencyOptions): void {
        this.deps.push(dep);
    }

    public addSystem<T extends SystemStage>(options: SystemOptions<T>): void {
        this.options.push({
            stage: options.stage,
            fn: options.fn,
            args: undefined,
            awaitMode: options.awaitMode,
        });
    }

    public addSystemWithArgs<T extends SystemStage, U extends SystemArgs>(options: SystemWithArgsOptions<T, U>): void {
        this.options.push({
            stage: options.stage,
            fn: options.fn as SystemWithArgsSync<SystemArgs> | SystemWithArgsAsync<SystemArgs>,
            args: options.args,
            awaitMode: options.awaitMode,
        });
    }

    public addSystems<T extends SystemStage>(options: SystemsOptions<T>): void {
        for (const optionFn of options.fns) {
            this.options.push({
                stage: options.stage,
                fn: optionFn,
                args: undefined,
                awaitMode: undefined,
            });
        }
    }

    public clear(): void {
        this.deps = [];
        this.entries = [];
        this.options = [];
    }

    public async execute(world: World): Promise<void> {
        for (const entry of this.entries) {
            const { fn, awaitMode, args } = entry.options;

            // Wait for incoming dependencies
            for (const depAsync of entry.depsAsync) {
                if (depAsync.promise !== undefined) {
                    // log.infoDebug("Waiting for system '{}'", depAsync.options.fn.name);
                    await depAsync.promise;
                    depAsync.promise = undefined;
                }
            }

            // Call system
            if (awaitMode === "dependency") {
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
            const mode = entry.options.awaitMode ?? "sync";
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

                node.depsOut.delete(nodeDepIdx);
                nodeDep.depsIn.delete(node.idx);

                if (node.options.awaitMode === "dependency") {
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
