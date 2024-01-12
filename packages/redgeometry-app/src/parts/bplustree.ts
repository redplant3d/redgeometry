import { Box2 } from "redgeometry/src/primitives/box";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { Immutable } from "redgeometry/src/utility/types";
import { AppContext2D } from "../context.js";
import { RangeInputElement, TextBoxInputElement } from "../input.js";
import { AppLauncher, type AppPart } from "../launcher.js";

enum NodeType {
    Internal,
    Leaf,
}

type InternalNode<T> = {
    type: NodeType.Internal;
    parent: InternalNode<T> | undefined;
    length: number;
    keys: T[];
    children: Node<T>[];
};

type LeafNode<T> = {
    type: NodeType.Leaf;
    parent: InternalNode<T> | undefined;
    length: number;
    values: T[];
    next: LeafNode<T> | undefined;
};

type Node<T> = LeafNode<T> | InternalNode<T>;

export class BPlusTreeAppPart implements AppPart {
    private bPlusTree: BPlusTree<number>;
    private context: AppContext2D;
    private launcher: AppLauncher;

    public inputBranchSize: RangeInputElement;
    public inputCount: RangeInputElement;
    public inputLeafSize: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputBranchSize = new TextBoxInputElement("branchsize", "4");
        this.inputBranchSize.setStyle("width: 40px");

        this.inputLeafSize = new TextBoxInputElement("leafsize", "16");
        this.inputLeafSize.setStyle("width: 40px");

        this.inputCount = new RangeInputElement("count", "0", "128", "32");
        this.inputCount.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputCount.setStyle("width: 200px");

        const comp = (a: number, b: number): number => Math.floor(a) - Math.floor(b);
        this.bPlusTree = new BPlusTree<number>(comp);
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.drawBPlusTree(this.context, this.bPlusTree);
    }

    public reset(): void {
        return;
    }

    public update(_delta: number): void {
        const seed = this.launcher.inputSeed.getInt();
        const branchSize = this.inputBranchSize.getInt();
        const leafSize = this.inputLeafSize.getInt();
        const count = this.inputCount.getInt();

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

        this.bPlusTree = bptree;
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputBranchSize);
        this.launcher.addAppInput(this.inputLeafSize);
        this.launcher.addAppInput(this.inputCount);
    }

    private drawBPlusTree(ctx: AppContext2D, bptree: BPlusTree<number>): void {
        const boxWidth = 26 * 2.5;
        const boxHeight = 26;
        const boxOffset = 20;
        const boxPadding = 10;

        printNode(bptree.getRootNode(), 0, 0);

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
}

class BPlusTree<T> {
    private branchSize: number;
    private compareFn: (a: T, b: T) => number;
    private leafSize: number;
    private root: Node<T>;

    public constructor(compareFn: (a: T, b: T) => number, branchSize?: number, leafSize?: number) {
        this.root = this.leafNodeCreate(undefined, 0, [], undefined);
        this.compareFn = compareFn;

        this.branchSize = branchSize ?? 16;
        this.leafSize = leafSize ?? this.branchSize;
    }

    public add(value: T): void {
        const node = this.findLeafNode(this.root, value);

        if (node.length < this.leafSize) {
            // Size is big enough to add the value
            this.leafNodeAdd(node, value);
        } else {
            // We need to split the leaf, then add the value
            this.leafNodeSplitAdd(node, value);
        }
    }

    public clear(): void {
        // Let the GC do the heavy lifting of cleaning up
        this.root = this.leafNodeCreate(undefined, 0, [], undefined);
    }

    /**
     * @deprecated TODO: Rewrite to iterator.
     */
    public *getGenerator(): Generator<T> {
        let leaf = this.getFirstLeaf();

        for (;;) {
            for (let i = 0; i < leaf.length; i++) {
                yield leaf.values[i];
            }

            if (leaf.next !== undefined) {
                leaf = leaf.next;
            } else {
                return;
            }
        }
    }

    public getRootNode(): Immutable<Node<T>> {
        return this.root;
    }

    public toArray(): T[] {
        const array: T[] = [];

        for (const value of this.getGenerator()) {
            array.push(value);
        }

        return array;
    }

    public validate(comp: (a: T, b: T) => number): boolean {
        const generator = this.getGenerator();
        const result = generator.next();

        if (result.done === true) {
            return true;
        }

        let val0 = result.value;

        for (const val1 of this.getGenerator()) {
            if (comp(val0, val1) > 0) {
                return false;
            }
            val0 = val1;
        }

        return validateNode(this.root, this.branchSize, this.leafSize);

        function validateNode(node: Node<T>, branchSize: number, leafSize: number): boolean {
            let validate = true;
            if (node.type === NodeType.Internal) {
                validate &&= node.length <= branchSize;
                for (const child of node.children) {
                    validate &&= validateNode(child, branchSize, leafSize);
                }
            } else {
                validate &&= node.length <= leafSize;
            }
            return validate;
        }
    }

    private findLeafNode(node: Node<T>, key: T): LeafNode<T> {
        // Recursively search nodes
        if (node.type === NodeType.Internal) {
            const idx = this.findNearestIndexEnd(node.keys, key);
            return this.findLeafNode(node.children[idx], key);
        } else {
            // Found the leaf
            return node;
        }
    }

    private findNearestIndexEnd(array: T[], value: T, start = 0): number {
        const comparer = this.compareFn;

        let low = start;
        let high = array.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (comparer(value, array[mid]) < 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

    private getFirstLeaf(): LeafNode<T> {
        let node = this.root;

        while (node.type !== NodeType.Leaf) {
            node = node.children[0];
        }

        return node;
    }

    private internalNodeAdd(node: InternalNode<T>, child: Node<T>, refKey: T, newKey: T): void {
        // Find the insertion index and update the parent/node
        const start = this.findNearestIndexEnd(node.keys, refKey);
        child.parent = node;
        node.keys.splice(start, 0, newKey);
        node.children.splice(start + 1, 0, child);
        node.length += 1;
    }

    private internalNodeCreate(
        parent: InternalNode<T> | undefined,
        length: number,
        keys: T[],
        children: Node<T>[],
    ): InternalNode<T> {
        return { type: NodeType.Internal, parent, length, keys, children };
    }

    private internalNodeSplitAdd(node: InternalNode<T>, danglingNode: Node<T>, newKey: T): void {
        // TODO: This may cause errors, we need to find predecessor of `danglingNode` and insert after
        const start = this.findNearestIndexEnd(node.keys, newKey);
        node.keys.splice(start, 0, newKey);

        const mid = (node.length + 2) >>> 1;
        const isLeft = start < mid - 1;
        const length = isLeft ? mid - 1 : mid;

        const [midKey] = node.keys.splice(mid - 1, 1);

        const newLength = node.length - length;
        const newKeys = node.keys.splice(mid - 1, newLength);
        const newChildren = node.children.splice(length, newLength);
        const newNode = this.internalNodeCreate(node.parent, newLength, newKeys, newChildren);

        // Update the childrens parent of the new node
        for (const child of newChildren) {
            child.parent = newNode;
        }

        node.length = length;

        // Add the dangling child to the node which has less children
        if (isLeft) {
            danglingNode.parent = node;
            node.children.splice(start + 1, 0, danglingNode);
            node.length += 1;
        } else {
            danglingNode.parent = newNode;
            newNode.children.splice(start + 1 - length, 0, danglingNode);
            newNode.length += 1;
        }

        // Try to add the new node to the parent of `node`
        this.nodeAddToParent(node, newNode, newKey, midKey);
    }

    private leafNodeAdd(node: LeafNode<T>, value: T): void {
        // Find the insertion index and update the node
        const start = this.findNearestIndexEnd(node.values, value);
        node.values.splice(start, 0, value);
        node.length += 1;
    }

    private leafNodeCreate(
        parent: InternalNode<T> | undefined,
        length: number,
        values: T[],
        next: LeafNode<T> | undefined,
    ): LeafNode<T> {
        return { type: NodeType.Leaf, parent, length, values, next };
    }

    private leafNodeSplitAdd(node: LeafNode<T>, value: T): void {
        // Find position to split the node
        const mid = node.length >>> 1;
        const isLeft = this.compareFn(value, node.values[mid]) < 0;
        const length = isLeft ? mid : mid + 1;

        const newLength = node.length - length;
        const newValues = node.values.splice(length, newLength);
        const newNode = this.leafNodeCreate(node.parent, newLength, newValues, node.next);

        node.length = length;
        node.next = newNode;

        // Add the value to the appropriate node and add the new node to the parent node
        this.leafNodeAdd(isLeft ? node : newNode, value);
        this.nodeAddToParent(node, newNode, node.values[0], newNode.values[0]);
    }

    private nodeAddToParent(node: Node<T>, newNode: Node<T>, refKey: T, newKey: T): void {
        const parent = node.parent;

        if (parent !== undefined) {
            if (parent.length < this.branchSize) {
                // Size is big enough to add the new node
                this.internalNodeAdd(parent, newNode, refKey, newKey);
            } else {
                // We need to split the node
                this.internalNodeSplitAdd(parent, newNode, newKey);
            }
        } else {
            // There is no parent, so create a new one (tree grows)
            this.nodeAddToRoot(node, newNode, newKey);
        }
    }

    private nodeAddToRoot(node: Node<T>, newNode: Node<T>, newKey: T): void {
        const root = this.internalNodeCreate(undefined, 2, [newKey], [node, newNode]);

        node.parent = root;
        newNode.parent = root;

        this.root = root;
    }
}
