export class Bitset {
    public data: Uint32Array;

    constructor(data: Uint32Array) {
        this.data = data;
    }

    public static from(b: Bitset): Bitset {
        const len = b.getMinDataLength();
        const data = new Uint32Array(len);

        for (let i = 0; i < len; i++) {
            data[i] = b.data[i];
        }

        return new Bitset(data);
    }

    public static fromBits(bits: number[]): Bitset {
        const maxIdx = Math.max(...bits) >>> 5;
        const data = new Uint32Array(maxIdx + 1);

        for (const bit of bits) {
            const idx = bit >>> 5;
            const val = 1 << (bit & 0x1f);

            data[idx] |= val;
        }

        return new Bitset(data);
    }

    public static fromCapacity(minBitCapacity: number): Bitset {
        const len = Math.max(minBitCapacity >>> 5, 1);
        const data = new Uint32Array(len);

        return new Bitset(data);
    }

    public static fromElements(elements: Iterable<number>): Bitset {
        const data = new Uint32Array(elements);
        return new Bitset(data);
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

    public clone(): Bitset {
        const data = this.data.slice();
        return new Bitset(data);
    }

    public ensureCapacity(len: number): void {
        if (this.data.length < len) {
            // Grow
            const data = new Uint32Array(len);
            data.set(this.data);
            this.data = data;
        }
    }

    /**
     * Returns true if both bit sets have equal active bits.
     */
    public eq(b: Bitset): boolean {
        // Ensure that `data1.length >= data2.length`
        let data1 = this.data;
        let data2 = b.data;

        if (data1.length < data2.length) {
            const data = data1;
            data1 = data2;
            data2 = data;
        }

        const len = data2.length;

        // Intersection
        for (let i = 0; i < len; i++) {
            if (data1[i] !== data2[i]) {
                return false;
            }
        }

        // Difference
        for (let i = len; i < data1.length; i++) {
            if (data1[i] !== 0) {
                return false;
            }
        }

        return true;
    }

    public getDataString(): string {
        let str = "";

        // LSB to MSB
        for (let i = 0; i < this.data.length; i++) {
            str += this.data[i].toString(2).padStart(32, "0");
            str += "\n";
        }

        return str;
    }

    public getMinDataLength(): number {
        let idx = this.data.length - 1;

        while (idx >= 0) {
            if (this.data[idx] === 0) {
                idx--;
            } else {
                break;
            }
        }

        return idx + 1;
    }

    public has(x: number): boolean {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        if (this.data.length < idx + 1) {
            return false;
        }

        return (this.data[idx] & val) === val;
    }

    public isSubsetOf(b: Bitset): boolean {
        const data1 = this.data;
        const data2 = b.data;

        const len = Math.min(data1.length, data2.length);

        // Intersection
        for (let i = 0; i < len; i++) {
            if ((data1[i] & data2[i]) !== data1[i]) {
                return false;
            }
        }

        // Difference (only if `data1.length > data2.length`)
        for (let i = len; i < data1.length; i++) {
            if (data1[i] !== 0) {
                return false;
            }
        }

        return true;
    }

    public reset(): void {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    }

    public set(x: number): void {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        this.ensureCapacity(idx + 1);
        this.data[idx] |= val;
    }

    public shrink(): void {
        const lenNext = this.getMinDataLength();

        if (this.data.length > lenNext) {
            this.data = this.data.slice(0, lenNext);
        }
    }

    public toggle(x: number): void {
        const idx = x >>> 5;
        const val = 1 << (x & 0x1f);

        this.ensureCapacity(idx + 1);
        this.data[idx] ^= val;
    }
}
