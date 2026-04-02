export class Bitset {
    public data: Uint32Array;

    public constructor(data: Uint32Array) {
        this.data = data;
    }

    public static from(b: Bitset): Bitset {
        const len = b.minDataLength();
        const data = new Uint32Array(len);

        for (let i = 0; i < len; i++) {
            data[i] = b.data[i];
        }

        return new Bitset(data);
    }

    public static fromBits(bits: ReadonlyArray<number>): Bitset {
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
            // Both values are signed integers because of bitwise operators
            const a = data1[i] & data2[i];
            const b = data1[i] | 0;

            if (a !== b) {
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

    public minDataLength(): number {
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
        const lenNext = this.minDataLength();

        if (this.data.length > lenNext) {
            this.data = this.data.slice(0, lenNext);
        }
    }

    public toBigInt(): bigint {
        let val = 0n;
        let shift = 0n;

        // LSB to MSB
        for (let i = 0; i < this.data.length; i++) {
            val |= BigInt(this.data[i]) << shift;
            shift += 32n;
        }

        return val;
    }

    public toBinaryString(): string {
        const lastIdx = this.data.length - 1;

        if (lastIdx < 0) {
            // Empty
            return "0b0";
        }

        let str = "0b";

        // MSB to LSB
        for (let i = lastIdx; i >= 0; i--) {
            // Convert to unsigned integer
            const n = this.data[i] >>> 0;

            if (i === lastIdx) {
                str += n.toString(2);
            } else {
                str += n.toString(2).padStart(32, "0");
            }
        }

        return str;
    }

    public toHexString(): string {
        const lastIdx = this.data.length - 1;

        if (lastIdx < 0) {
            // Empty
            return "0x0";
        }

        let str = "0x";

        // MSB to LSB
        for (let i = lastIdx; i >= 0; i--) {
            // Convert to unsigned integer
            const n = this.data[i] >>> 0;

            if (i === lastIdx) {
                str += n.toString(16);
            } else {
                str += n.toString(16).padStart(8, "0");
            }
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
