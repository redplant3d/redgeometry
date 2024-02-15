export class BitSet {
    public data: Uint32Array;

    constructor(data: Uint32Array) {
        this.data = data;
    }

    public static fromCapacity(minBitCapacity: number): BitSet {
        const len = Math.max(minBitCapacity >>> 5, 1);
        const data = new Uint32Array(len);

        return new BitSet(data);
    }

    public static fromValues(values: number[]): BitSet {
        const maxIdx = Math.max(...values) >>> 5;
        const data = new Uint32Array(maxIdx + 1);

        for (const x of values) {
            const idx = x >>> 5;
            const val = 1 << (x & 0x1f);

            data[idx] |= val;
        }

        return new BitSet(data);
    }

    public bitCapacity(): number {
        return this.data.length << 5;
    }

    public clear(x: number): void {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        this.ensureCapacity(idx + 1);
        this.data[idx] &= ~val;
    }

    public ensureCapacity(len: number): void {
        if (this.data.length < len) {
            // Grow
            const data = new Uint32Array(len);
            data.set(this.data);
            this.data = data;
        }
    }

    public has(x: number): boolean {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        if (this.data.length < idx + 1) {
            return false;
        }

        return (this.data[idx] & val) === val;
    }

    public set(x: number): void {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        this.ensureCapacity(idx + 1);
        this.data[idx] |= val;
    }

    public shrink(): void {
        let idx = this.data.length - 1;

        while (idx > 0) {
            if (this.data[idx] === 0) {
                idx--;
            } else {
                break;
            }
        }

        const lenNext = idx + 1;

        if (this.data.length > lenNext) {
            this.data = this.data.slice(0, lenNext);
        }
    }

    public toString(): string {
        let str = "";

        // LSB to MSB
        for (let i = 0; i < this.data.length; i++) {
            str += this.data[i].toString(2).padStart(32, "0");
            str += "\n";
        }

        return str;
    }

    public toggle(x: number): void {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        this.ensureCapacity(idx + 1);
        this.data[idx] ^= val;
    }
}
