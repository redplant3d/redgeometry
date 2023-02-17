import { CustomWindingOperator, EdgeSegmentRef2, PathOverlayData2, WindingOperator } from "../core";
import { isInWinding } from "./path-sweep";

export type PathOverlayEntry2 = {
    w0: number;
    w1: number;
    refs: EdgeSegmentRef2[];
};

export class PathOverlayState2 {
    private map: Map<number, PathOverlayEntry2>;

    constructor() {
        this.map = new Map<number, PathOverlayEntry2>();
    }

    public collectData(windingOperator: WindingOperator | CustomWindingOperator): [PathOverlayData2, PathOverlayData2] {
        const data0: PathOverlayData2 = { tag: [], refs: [] };
        const data1: PathOverlayData2 = { tag: [], refs: [] };

        for (const [set, entry] of this.map.entries()) {
            const w0 = entry.w0 + entry.w1;
            const w1 = entry.w1;

            const [in0, in1] = isInWinding(w0, w1, windingOperator);

            if (in0) {
                data0.tag.push(set);
                data0.refs.push(...entry.refs);
            }

            if (in1) {
                data1.tag.push(set);
                data1.refs.push(...entry.refs);
            }
        }

        data0.tag.sort(PathOverlayState2.compareTag);
        data1.tag.sort(PathOverlayState2.compareTag);

        return [data0, data1];
    }

    public getEntry(set: number): PathOverlayEntry2 {
        const entry = this.map.get(set);

        if (entry !== undefined) {
            return entry;
        } else {
            const entry: PathOverlayEntry2 = { w0: 0, w1: 0, refs: [] };
            this.map.set(set, entry);
            return entry;
        }
    }

    public reset(): void {
        this.map.clear();
    }

    private static compareTag(a: number, b: number): number {
        return a - b;
    }
}
