import type { Immutable } from "redgeometry/src/utility/types";

export enum NodeType {
    Internal,
    Leaf,
}

export type InternalNode<T> = {
    type: NodeType.Internal;
    parent: InternalNode<T> | undefined;
    length: number;
    keys: T[];
    children: Node<T>[];
};

export type LeafNode<T> = {
    type: NodeType.Leaf;
    parent: InternalNode<T> | undefined;
    length: number;
    values: T[];
    next: LeafNode<T> | undefined;
};

export type Node<T> = LeafNode<T> | InternalNode<T>;

export class BPlusTree<T> {
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
