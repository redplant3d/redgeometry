export class Uint64 {
    public readonly hi: number;
    public readonly lo: number;

    public constructor(hi: number, lo: number) {
        // Needs to be unsigned so that comparision always works
        this.hi = hi >>> 0;
        this.lo = lo >>> 0;
    }

    public static from(n: number): Uint64 {
        return new Uint64(0, n);
    }

    public add(u: Uint64): Uint64 {
        // Simple addition with carry bit
        let hi = this.hi + u.hi;
        const lo = this.lo + u.lo;
        if (lo > 0xffffffff) {
            hi++;
        }
        return new Uint64(hi, lo);
    }

    public and(u: Uint64): Uint64 {
        return new Uint64(this.hi & u.hi, this.lo & u.lo);
    }

    public and32(n: number): Uint64 {
        return new Uint64(0, this.lo & n);
    }

    public eq(u: Uint64): boolean {
        return this.hi === u.hi && this.lo === u.lo;
    }

    public gt(u: Uint64): boolean {
        return this.hi === u.hi ? this.lo > u.lo : this.hi > u.hi;
    }

    public gte(u: Uint64): boolean {
        return this.hi === u.hi ? this.lo >= u.lo : this.hi >= u.hi;
    }

    public lt(u: Uint64): boolean {
        return this.hi === u.hi ? this.lo < u.lo : this.hi < u.hi;
    }

    public lte(u: Uint64): boolean {
        return this.hi === u.hi ? this.lo <= u.lo : this.hi <= u.hi;
    }

    public mul(u: Uint64): Uint64 {
        // Multiply unsigned 64 bit integer to unsigned 64 bit integer (truncates overflow)
        const a = u32Mul64(this.lo, u.lo);
        const b = u32Mul32(this.hi, u.lo);
        const c = u32Mul32(this.lo, u.hi);
        return new Uint64(a.hi + b + c, a.lo);
    }

    public mul32(n: number): Uint64 {
        // Multiply unsigned 32 bit integer to unsigned 64 bit integer (low part only)
        return u32Mul64(this.lo, n);
    }

    public neg(): Uint64 {
        // Two's complement
        let hi = ~this.hi;
        const lo = ~this.lo + 1;
        if (this.lo === 0) {
            hi++;
        }
        return new Uint64(hi, lo);
    }

    public or(u: Uint64): Uint64 {
        return new Uint64(this.hi | u.hi, this.lo | u.lo);
    }

    public or32(n: number): Uint64 {
        return new Uint64(this.hi, this.lo | n);
    }

    public rol(n: number): Uint64 {
        return this.shl(n).or(this.shr(64 - n));
    }

    public ror(n: number): Uint64 {
        return this.shr(n).or(this.shl(64 - n));
    }

    public shl(n: number): Uint64 {
        n &= 63;
        if (n < 32) {
            const hi = (this.hi << n) | (this.lo >>> (32 - n));
            const lo = this.lo << n;
            return new Uint64(hi, lo);
        } else {
            // `lo` is always 0
            return new Uint64(this.lo << (n - 32), 0);
        }
    }

    public shr(n: number): Uint64 {
        n &= 63;
        if (n < 32) {
            const hi = this.hi >>> n;
            const lo = (this.lo >>> n) | (this.hi << (32 - n));
            return new Uint64(hi, lo);
        } else {
            // `hi` is always 0
            return new Uint64(0, this.hi >>> (n - 32));
        }
    }

    public sub(u: Uint64): Uint64 {
        return this.add(u.neg());
    }

    public toStringHex(): string {
        let str = "0x";
        if (this.hi !== 0) {
            str += this.hi.toString(16) + this.lo.toString(16).padStart(8, "0");
        } else {
            str += this.lo.toString(16);
        }
        return str;
    }

    public value(): number {
        return 4294967296 * this.hi + this.lo;
    }

    public xor(u: Uint64): Uint64 {
        return new Uint64(this.hi ^ u.hi, this.lo ^ u.lo);
    }

    public xor32(n: number): Uint64 {
        return new Uint64(this.hi, this.lo ^ n);
    }
}

function u32Mul32(u1: number, u2: number): number {
    // Multiply unsigned 32 bit integer to unsigned 32 bit integer
    const hi1 = u1 >>> 16;
    const lo1 = u1 & 0xffff;
    const hi2 = u2 >>> 16;
    const lo2 = u2 & 0xffff;
    const hilo = hi1 * lo2 + lo1 * hi2;
    const a = lo1 * lo2;
    const b = (hilo << 16) >>> 0;
    return (a + b) >>> 0;
}

function u32Mul64(u1: number, u2: number): Uint64 {
    // Multiply unsigned 32 bit integer to unsigned 64 bit integer
    const hi1 = u1 >>> 16;
    const lo1 = u1 & 0xffff;
    const hi2 = u2 >>> 16;
    const lo2 = u2 & 0xffff;
    const hilo = hi1 * lo2 + lo1 * hi2;
    const a = new Uint64(hi1 * hi2, lo1 * lo2);
    const b = new Uint64(hilo >>> 16, (hilo << 16) >>> 0);
    return a.add(b);
}
