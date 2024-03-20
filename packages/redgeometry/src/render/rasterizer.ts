import { assertDebug } from "../utility/debug.js";
import type { SoftwareCompositor } from "./compositor.js";
import { FillRule } from "./context.js";

const A8_SHIFT = 8;

export class SoftwareRasterizerAliased {
    private activeEdges: ActiveEdge[];
    private compositor: SoftwareCompositor;
    private edges: Edge[];
    private height: number;
    private mask: Uint8Array;
    private width: number;

    public constructor(compositor: SoftwareCompositor) {
        this.height = 0;
        this.width = 0;

        this.compositor = compositor;
        this.mask = compositor.mask;

        this.edges = [];
        this.activeEdges = [];
    }

    public addLine(xx0: number, yy0: number, xx1: number, yy1: number): void {
        assertDebug(xx0 >= 0, "Coordinate must not be NaN");
        assertDebug(yy0 >= 0, "Coordinate must not be NaN");
        assertDebug(xx1 <= this.width, "Coordinate must not be NaN");
        assertDebug(yy1 <= this.height, "Coordinate must not be NaN");

        const y0 = (yy0 * 256) >>> 0;
        const y1 = (yy1 * 256) >>> 0;

        // Strictly horizontal line (not visible in scanline)
        if (y0 === y1) {
            return;
        }

        const x0 = (xx0 * 256) >>> 0;
        const x1 = (xx1 * 256) >>> 0;

        // Fix bottom-to-top direction
        if (y0 < y1) {
            this.edges.push(new Edge(x0, y0, x1, y1, 1));
        } else {
            this.edges.push(new Edge(x1, y1, x0, y0, -1));
        }
    }

    public initialize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.mask = this.compositor.mask;
    }

    public render(fillRule: FillRule): void {
        const signAnd = fillRule === FillRule.NonZero ? 0xffffffff : 0x1;

        // Sort input edges by min y
        this.quicksort(0, this.edges.length - 1);

        let edge = this.edges[0];
        let edgeIdx = 1;

        let y = edge.y0 >>> A8_SHIFT;

        while (y < this.height) {
            const y1 = y << A8_SHIFT;

            // Add active edges
            while (edgeIdx <= this.edges.length && edge.y0 <= y1) {
                let dx = edge.x1 - edge.x0;
                const dy = edge.y1 - edge.y0;

                let inc = 1;

                if (dx < 0) {
                    dx = -dx;
                    inc = -1;
                }

                this.activeEdges.push({
                    x0: edge.x0 >>> A8_SHIFT,
                    y1: edge.y1,
                    m0: dx << A8_SHIFT,
                    d0: dy << A8_SHIFT,
                    d: (y1 - edge.y0) * dx,
                    inc: inc,
                    sign: edge.sign,
                });

                edge = this.edges[edgeIdx++];
            }

            // Remove inactive edges
            for (let i = 0; i < this.activeEdges.length; i++) {
                if (this.activeEdges[i].y1 <= y1) {
                    this.activeEdges.splice(i, 1);
                    i--;
                }
            }

            // Increment remaining ones
            for (let i = 0; i < this.activeEdges.length; i++) {
                const activeEdge = this.activeEdges[i];

                // Step and set new x
                while (activeEdge.d >= activeEdge.d0) {
                    activeEdge.d -= activeEdge.d0;
                    activeEdge.x0 += activeEdge.inc;
                }

                // Increment distance after
                activeEdge.d += activeEdge.m0;
            }

            if (this.activeEdges.length > 0) {
                // Sort active edges (insertion sort)
                for (let i = 1; i < this.activeEdges.length; i++) {
                    const pivot = this.activeEdges[i];
                    let j = i;

                    while (j > 0 && this.activeEdges[j - 1].x0 > pivot.x0) {
                        this.activeEdges[j] = this.activeEdges[j - 1];
                        j--;
                    }

                    this.activeEdges[j] = pivot;
                }

                let sign = 0;

                // Build scanline mask
                for (let i = 1; i < this.activeEdges.length; i++) {
                    const ae0 = this.activeEdges[i - 1];
                    const ae1 = this.activeEdges[i - 0];

                    sign += ae0.sign;

                    if ((sign & signAnd) !== 0) {
                        for (let j = ae0.x0; j < ae1.x0; j++) {
                            this.mask[j] = 255;
                        }
                    }
                }

                // Call the compositor
                this.compositor.operator(
                    this.width * y,
                    this.activeEdges[0].x0,
                    this.activeEdges[this.activeEdges.length - 1].x0,
                );
            }

            y++;
        }

        this.edges = [];
        this.activeEdges = [];
    }

    public setCompositor(compositor: SoftwareCompositor): void {
        this.compositor = compositor;
        this.mask = compositor.mask;
    }

    private quicksort(left: number, right: number): void {
        const edges = this.edges;

        const pivot = edges[(left + right) >>> 1];
        let i = left;
        let j = right;

        while (i <= j) {
            while (edges[i].y0 < pivot.y0) {
                i++;
            }

            while (edges[j].y0 > pivot.y0) {
                j--;
            }

            if (i <= j) {
                const edge = edges[i];
                edges[i] = edges[j];
                edges[j] = edge;

                i++;
                j--;
            }
        }

        if (left < j) {
            this.quicksort(left, j);
        }

        if (i < right) {
            this.quicksort(i, right);
        }
    }
}

type ActiveEdge = {
    d: number;
    d0: number;
    inc: number;
    m0: number;
    sign: number;
    x0: number;
    y1: number;
};

class Edge {
    public sign: number;
    public x0: number;
    public x1: number;
    public y0: number;
    public y1: number;

    public constructor(x0: number, y0: number, x1: number, y1: number, sign: number) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this.sign = sign;
    }
}
