/**
 * Type for double-word arithmetic with floating point numbers.
 *
 * References:
 * - Mioara Joldes, Jean-Michel Muller, Valentina Popescu.
 *   *Tight and rigourous error bounds for basic building blocks of double-word arithmetic*.
 *   ACM Transactions on Mathematical Software, Association for Computing Machinery, 2017, 44 (2), pp.1 - 27.
 */
export class Float128 {
    public readonly hi: number;
    public readonly lo: number;

    public constructor(hi: number, lo: number) {
        this.hi = hi;
        this.lo = lo;
    }

    public static from(n: number): Float128 {
        return new Float128(n, 0);
    }

    public add(f: Float128): Float128 {
        // *AccurateDWPlusDW*
        const s = f64Add64(this.hi, f.hi);
        const t = f64Add64(this.lo, f.lo);
        const v = f64Add64Fast(s.hi, s.lo + t.hi);
        return f64Add64Fast(v.hi, t.lo + v.lo);
    }

    public add64(n: number): Float128 {
        // *DWPlusFP*
        const s = f64Add64(this.hi, n);
        return f64Add64Fast(s.hi, this.lo + s.lo);
    }

    public div(f: Float128): Float128 {
        // *DWDivDW2* (cannot use *DWDivDW3* because of FMA requirement)
        const thi = this.hi / f.hi;
        const r = f128Mul64(this, thi);
        const nhi = this.hi - r.hi;
        const dlo = this.lo - r.lo;
        const d = nhi + dlo;
        return f64Add64Fast(thi, d / f.hi);
    }

    public div64(n: number): Float128 {
        // *DWDivFP3*
        const thi = this.hi / n;
        const pi = f64Mul64(thi, n);
        const dhi = this.hi - pi.hi;
        const dt = dhi - pi.lo;
        const d = dt + this.lo;
        return f64Add64Fast(thi, d / n);
    }

    public mul(f: Float128): Float128 {
        // *DWTimesDW1* (cannot use *DWTimesDW2* or *DWTimesDW3* because of FMA requirement)
        const c = f64Mul64(this.hi, f.hi);
        const tlo1 = this.hi * f.lo;
        const tlo2 = this.lo * f.hi;
        const clo2 = tlo1 + tlo2;
        return f64Add64Fast(c.hi, c.lo + clo2);
    }

    public mul64(n: number): Float128 {
        // *DWTimesFP2* (cannot use *DWTimesFP3* because of FMA requirement)
        const c = f64Mul64(this.hi, n);
        const clo2 = this.lo * n;
        return f64Add64Fast(c.hi, c.lo + clo2);
    }

    public neg(): Float128 {
        return new Float128(-this.hi, -this.lo);
    }

    public sub(f: Float128): Float128 {
        return this.add(f.neg());
    }

    public sub64(n: number): Float128 {
        return this.add64(-n);
    }

    public value(): number {
        return this.hi + this.lo;
    }
}

function f64Add64(n1: number, n2: number): Float128 {
    // *2Sum* (Knuth, Møller)
    const s = n1 + n2;
    const a = s - n2;
    const b = s - a;
    const da = n1 - a;
    const db = n2 - b;
    const t = da + db;
    return new Float128(s, t);
}

function f64Add64Fast(n1: number, n2: number): Float128 {
    // *Fast2Sum* (Dekker)
    const s = n1 + n2;
    const z = s - n1;
    const t = n2 - z;
    return new Float128(s, t);
}

function f128Mul64(f: Float128, n: number): Float128 {
    // *DWTimesFP1* (needed for `div`)
    const c = f64Mul64(f.hi, n);
    const t = f64Add64Fast(c.hi, f.lo * n);
    return f64Add64Fast(t.hi, t.lo + c.lo);
}

function f64Mul64(n1: number, n2: number): Float128 {
    // *2Prod* (Dekker)
    const x = f64Split(n1);
    const y = f64Split(n2);
    const s = n1 * n2;
    const t1 = -s + x.hi * y.hi;
    const t2 = t1 + x.hi * y.lo;
    const t3 = t2 + x.lo * y.hi;
    const t = t3 + x.lo * y.lo;
    return new Float128(s, t);
}

function f64Split(n: number): Float128 {
    // Split float at `2^7 + 1` (Veltkamp)
    const g = 134217729 * n;
    const d = n - g;
    const s = g + d;
    const t = n - s;
    return new Float128(s, t);
}
