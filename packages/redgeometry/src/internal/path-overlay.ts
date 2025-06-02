import type { PathOverlayData2 } from "../core/path-overlay.js";
import type { EdgeSegmentRef2 } from "../core/snapround.js";
import { isWindingInside2, type CustomWindingOperator, type WindingOperator } from "../core/winding.js";

export type PathOverlayEntry2 = {
    wind1: number;
    wind2: number;
    refs: EdgeSegmentRef2[];
};

export class PathOverlayState2 {
    private map: Map<number, PathOverlayEntry2>;

    public constructor() {
        this.map = new Map<number, PathOverlayEntry2>();
    }

    public collectData(windingOperator: WindingOperator | CustomWindingOperator): [PathOverlayData2, PathOverlayData2] {
        const data0: PathOverlayData2 = { tag: [], refs: [] };
        const data1: PathOverlayData2 = { tag: [], refs: [] };

        for (const [set, entry] of this.map.entries()) {
            const wind1 = entry.wind1 + entry.wind2;
            const wind2 = entry.wind2;

            const [in1, in2] = isWindingInside2(wind1, wind2, windingOperator);

            if (in1) {
                data0.tag.push(set);
                data0.refs.push(...entry.refs);
            }

            if (in2) {
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
            const entry: PathOverlayEntry2 = { wind1: 0, wind2: 0, refs: [] };
            this.map.set(set, entry);
            return entry;
        }
    }

    public reset(): void {
        this.map.clear();
    }

    private static compareTag(this: void, a: number, b: number): number {
        return a - b;
    }
}
