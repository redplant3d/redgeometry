import { clamp } from "../utility/scalar.js";

export class ColorRgba {
    public a: number;
    public b: number;
    public g: number;
    public r: number;

    public constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public static from(obj: { r: number; g: number; b: number; a: number }): ColorRgba {
        return new ColorRgba(obj.r, obj.g, obj.b, obj.a);
    }

    public static fromArray(data: number[], offset = 0): ColorRgba {
        return new ColorRgba(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromHSV(h: number, s: number, v: number, a: number): ColorRgba {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));

        switch (i % 6) {
            case 0:
                return new ColorRgba(v, t, p, a);
            case 1:
                return new ColorRgba(q, v, p, a);
            case 2:
                return new ColorRgba(p, v, t, a);
            case 3:
                return new ColorRgba(p, q, v, a);
            case 4:
                return new ColorRgba(t, p, v, a);
            case 5:
                return new ColorRgba(v, p, q, a);
        }

        return new ColorRgba(0, 0, 0, a);
    }

    public static fromNumber(n: number): ColorRgba {
        const a = (n >>> 0) & 0xff;
        const b = (n >>> 8) & 0xff;
        const g = (n >>> 16) & 0xff;
        const r = (n >>> 24) & 0xff;

        return new ColorRgba(r / 255, g / 255, b / 255, a / 255);
    }

    public clone(): ColorRgba {
        return new ColorRgba(this.r, this.g, this.b, this.a);
    }

    public style(): string {
        const r = this.clampFloatToHex(this.r);
        const g = this.clampFloatToHex(this.g);
        const b = this.clampFloatToHex(this.b);
        const a = this.clampFloatToHex(this.a);
        return `#${r}${g}${b}${a}`;
    }

    public toArray(): [number, number, number, number] {
        return [this.r, this.g, this.b, this.a];
    }

    private clampFloatToHex(f: number): string {
        const i = clamp(Math.round(255 * f), 0, 255);
        return i.toString(16).padStart(2, "0");
    }
}
