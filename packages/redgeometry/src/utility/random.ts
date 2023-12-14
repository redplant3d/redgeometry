import { assert } from "./debug.js";
import { betweenFloat, betweenInt } from "./scalar.js";

export interface Random {
    nextFloat(): number;
    nextFloatBetween(a: number, b: number): number;
    nextInt(): number;
    nextIntBetween(a: number, b: number): number;
}

const FLOAT_LSB_32 = 2 ** -32;
const FLOAT_LSB_53 = 2 ** -53;

/**
 * Pseudorandom number generator based on xor/shift/rotation with a state of 128 bits.
 *
 * References:
 * - David Blackman, Sebastiano Vigna.
 *   *Scrambled Linear Pseudorandom Number Generators*.
 *   xoshiro/xoroshiro generators and the PRNG shootout (https://prng.di.unimi.it/).
 */
export class RandomXSR128 implements Random {
    private state: Int32Array;

    public constructor(state: Int32Array) {
        assert(state.length === 4, "Array length of 'state' must be equal to 4");

        this.state = state;
    }

    /**
     * Initializes a new state from a simple LCG.
     */
    public static fromSeedLcg(seed?: number): RandomXSR128 {
        const state = initStateLcg(seed, 4);
        return new RandomXSR128(state);
    }

    /**
     * Returns a pseudorandom floating point number in the range [0, 1).
     */
    public nextFloat(): number {
        // Contruct high/low part of the mantissa with different scramblers
        const x1 = scrambleXSR128StarStar(this.state);
        const x2 = scrambleXSR128Plus(this.state);
        advanceXSR128(this.state);

        // Fill high part with full 32 bits of `x1` and low part with high 21 bits of `x2`
        // which gives a full mantissa without loss of precision (parts are continuous)
        return FLOAT_LSB_32 * (x1 >>> 0) + FLOAT_LSB_53 * (x2 >>> 11);
    }

    /**
     * Returns a pseudorandom floating point number in the range [min(a, b), max(a, b)).
     */
    public nextFloatBetween(a: number, b: number): number {
        const t = this.nextFloat();
        return betweenFloat(a, b, t);
    }

    /**
     * Returns a pseudorandom 32-bit signed integer in the range [-2147483648, 2147483647].
     */
    public nextInt(): number {
        const x = scrambleXSR128StarStar(this.state);
        advanceXSR128(this.state);
        return x | 0;
    }

    /**
     * Returns a pseudorandom 32-bit signed integer in the range [min(a, b), max(a, b)].
     */
    public nextIntBetween(a: number, b: number): number {
        const x = this.nextInt();

        // Construct a floating number with 32 bit of precision
        const t = FLOAT_LSB_32 * (x >>> 0);
        return betweenInt(a, b, t);
    }
}

function initStateLcg(seed: number | undefined, byteLength: number): Int32Array {
    // Initialize the state from a simple LCG `y = (a * x + c) % m`
    // which satifies the Hull–Dobell theorem:
    //     m = 2^32 = 4294967296
    //     c = 3^18 = 387420489 (0x17179149)
    //     a = 4 * c + 1 = 1549681957 (0x5c5e4525)
    const x = seed ?? 4294967296 * Math.random();
    const s = new Int32Array(byteLength);

    let y = x | 0;

    for (let i = 0; i < byteLength; i++) {
        y = Math.imul(0x5c5e4525, y) | 0;
        y = (y + 0x17179149) | 0;
        s[i] = y;
    }

    return s;
}

function advanceXSR128(s: Int32Array): void {
    // `xoshiro128` linear engine for 32-bit elements
    const t = s[1] << 9;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = (s[3] << 11) | (s[3] >>> 21);
}

function scrambleXSR128Plus(s: Int32Array): number {
    // `xoshiro128+` algorithm (2-dimensionally equidistributed)
    return s[0] + s[3];
}

function _scrambleXSR128PlusPlus(s: Int32Array): number {
    // `xoshiro128++` algorithm (2-dimensionally equidistributed)
    let x = s[0] + s[3];
    x = (x << 7) | (x >>> 25);
    return x + s[0];
}

function scrambleXSR128StarStar(s: Int32Array): number {
    // `xoshiro128**` algorithm (4-dimensionally equidistributed)
    let x = s[1] * 5;
    x = (x << 7) | (x >>> 25);
    return x * 9;
}
