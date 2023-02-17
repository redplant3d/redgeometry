import { ColorRgba } from "../primitives/color";
import { CompositeOperation } from "../render/context";
import { Image2 } from "../render/image";

export class Compositor {
    private buffer: Uint8Array;
    private sa: number;
    private sb: number;
    private sg: number;
    private sr: number;

    public mask: Uint8Array;
    public operator: (index: number, first: number, last: number) => void;

    constructor() {
        this.mask = new Uint8Array();
        this.operator = this.sourceOverSolid;

        this.sb = 0;
        this.sg = 0;
        this.sr = 0;
        this.sa = 0;

        this.buffer = new Uint8Array();
    }

    public fill(): void {
        const d = this.buffer;

        let dIdx = 0;

        // Process 1 pixel in an iteration
        while (dIdx < d.length) {
            d[dIdx++] = this.sr;
            d[dIdx++] = this.sg;
            d[dIdx++] = this.sb;
            d[dIdx++] = this.sa;
        }
    }

    public initialize(image: Image2): void {
        this.buffer = image.getBuffer8();
        this.mask = new Uint8Array(image.getWidth());
    }

    public setColor(c: ColorRgba): void {
        // Premultiply
        this.sr = mulDiv255(c.r, c.a);
        this.sg = mulDiv255(c.g, c.a);
        this.sb = mulDiv255(c.b, c.a);
        this.sa = c.a;
    }

    public setOperation(compOp: CompositeOperation): void {
        switch (compOp) {
            case CompositeOperation.Source: {
                this.operator = this.sourceSolid;
                break;
            }
            default: {
                this.operator = this.sourceOverSolid;
                break;
            }
        }
    }

    public sourceOverSolid(index: number, first: number, last: number): void {
        const d = this.buffer;

        let mIdx = first;
        let dIdx = 4 * (index + mIdx);

        // Process 1 pixel in an iteration
        while (mIdx < last) {
            const ma = this.mask[mIdx];
            const da = mulDiv255(this.sa, ma);

            // Dca' = Sca * m + Dca * (1 - Sa * m)
            // Da'  = Sa  * m + Da  * (1 - Sa * m)
            d[dIdx] = blend(this.sr, ma, d[dIdx++], da);
            d[dIdx] = blend(this.sg, ma, d[dIdx++], da);
            d[dIdx] = blend(this.sb, ma, d[dIdx++], da);
            d[dIdx] = blend(this.sa, ma, d[dIdx++], da);

            this.mask[mIdx++] = 0;
        }
    }

    public sourceSolid(index: number, first: number, last: number): void {
        const d = this.buffer;
        let mIdx = first;
        let dIdx = 4 * (index + mIdx);

        // Process 1 pixel in an iteration
        while (mIdx < last) {
            const ma = this.mask[mIdx];

            // Dca' = Sca * m + Dca * (1 - m)
            // Da'  = Sa  * m + Da  * (1 - m)
            d[dIdx] = blend(this.sr, ma, d[dIdx++], ma);
            d[dIdx] = blend(this.sg, ma, d[dIdx++], ma);
            d[dIdx] = blend(this.sb, ma, d[dIdx++], ma);
            d[dIdx] = blend(this.sa, ma, d[dIdx++], ma);

            this.mask[mIdx++] = 0;
        }
    }
}

function blend(sca: number, sa: number, dca: number, da: number): number {
    return mulDiv255(sca, sa) + mulDiv255(dca, neg255(da));
}

function mulDiv255(a: number, b: number): number {
    const x = a * b + 128;
    return (x + (x >>> 8)) >>> 8;
}

function neg255(da: number): number {
    return 255 - da;
}
