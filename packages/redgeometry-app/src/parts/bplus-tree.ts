import { Box2 } from "redgeometry/src/primitives/box";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { Immutable } from "redgeometry/src/utility/types";
import type { AppContextPlugin } from "../ecs-modules/app-context.js";
import { AppContextModule } from "../ecs-modules/app-context.js";
import type { AppInputData } from "../ecs-modules/app-input.js";
import { RangeInputElement, TextBoxInputElement } from "../ecs-modules/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs-modules/app.js";
import type { WorldOptions } from "../ecs/app.js";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.js";
import { DEFAULT_WORLD_SCHEDULES, type World } from "../ecs/world.js";
import { BPlusTree, NodeType, type Node } from "../utility/bplus-tree.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputBranchSize: RangeInputElement;
    inputCount: RangeInputElement;
    inputLeafSize: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    bplusTree: BPlusTree<number>;
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
    branchSize: number;
    leafSize: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputBranchSize = new TextBoxInputElement("branchsize", "4");
    inputBranchSize.setStyle("width: 40px");
    inputElements.push(inputBranchSize);

    const inputLeafSize = new TextBoxInputElement("leafsize", "16");
    inputLeafSize.setStyle("width: 40px");
    inputElements.push(inputLeafSize);

    const inputCount = new RangeInputElement("count", "0", "128", "32");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputBranchSize,
        inputLeafSize,
        inputCount,
    });
}

function initRemoteSystem(world: World): void {
    const comp = (a: number, b: number): number => Math.floor(a) - Math.floor(b);

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        bplusTree: new BPlusTree<number>(comp),
    });
}

function writeStateSystem(world: World): void {
    const { inputBranchSize, inputCount, inputLeafSize } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: inputCount.getInt(),
        branchSize: inputBranchSize.getInt(),
        leafSize: inputLeafSize.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { branchSize, count, leafSize } = world.readData<AppPartStateData>("app-part-state");
    const { seed } = world.readData<AppStateData>("app-state");

    const random = RandomXSR128.fromSeedLcg(seed);

    const comp = (a: number, b: number): number => Math.floor(a) - Math.floor(b);
    const bptree = new BPlusTree<number>(comp, branchSize, leafSize);

    for (let i = 1; i <= count; i++) {
        const val = random.nextIntBetween(0, 10) + 0.003 * i;
        // const val = random.nextIntBetween(0, 10);

        if (i === count) {
            bptree.add(val);
        } else {
            bptree.add(val);
        }
    }

    // log.infoDebug("Values: {}", bptree.toArray());
    log.assertFn(() => bptree.validate(comp), "Validation failed");

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        bplusTree: bptree,
    });
}

function renderSystem(world: World): void {
    const { bplusTree: bPlusTree } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();

    const boxWidth = 26 * 2.5;
    const boxHeight = 26;
    const boxOffset = 20;
    const boxPadding = 10;

    printNode(bPlusTree.getRootNode(), 0, 0);

    function printNode(node: Immutable<Node<number>>, x: number, y: number): number {
        let yNext = y;
        if (node.type === NodeType.Internal) {
            drawValues(node.keys, x, yNext, "#FF8888");
            for (const child of node.children) {
                yNext = printNode(child, x + 1, yNext + 1);
            }
        } else {
            drawValues(node.values, x, yNext, "#8888FF");
        }
        return yNext;
    }

    function drawValues(values: Immutable<number[]>, x: number, y: number, color: string): void {
        let xNext = x;
        for (const value of values) {
            const xCoord = boxOffset + xNext * (boxWidth + boxPadding);
            const yCoord = boxOffset + y * (boxHeight + boxPadding);
            const box = Box2.fromXYWH(xCoord, yCoord, boxWidth, boxHeight);
            ctx.fillBox(box, color);
            ctx.fillText(value.toFixed(3), box.getCenter(), "#FFFFFF");
            xNext++;
        }
    }
}

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "app-part-main";

    public setup(world: World): void {
        world.registerData<AppPartMainData>("app-part-main");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "app-part-remote";

    public setup(world: World): void {
        world.addModules([new AppContextModule()]);

        world.registerData<AppPartRemoteData>("app-part-remote");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

export const BPLUS_TREE_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const BPLUS_TREE_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};
