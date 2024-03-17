import { expect, test } from "vitest";
import { Bitset } from "../../src/index.js";

test("BitSet.eq", () => {
    const b1 = Bitset.fromElements([0]);
    const b2 = Bitset.fromElements([1]);
    const b3 = Bitset.fromElements([0, 0]);
    const b4 = Bitset.fromElements([1, 0]);
    const b5 = Bitset.fromElements([0, 1]);
    const b6 = Bitset.fromElements([1, 1]);

    expect(b1.eq(b1)).toEqual(true);
    expect(b1.eq(b2)).toEqual(false);
    expect(b1.eq(b3)).toEqual(true);
    expect(b1.eq(b4)).toEqual(false);
    expect(b1.eq(b5)).toEqual(false);
    expect(b1.eq(b6)).toEqual(false);

    expect(b2.eq(b1)).toEqual(false);
    expect(b2.eq(b2)).toEqual(true);
    expect(b2.eq(b3)).toEqual(false);
    expect(b2.eq(b4)).toEqual(true);
    expect(b2.eq(b5)).toEqual(false);
    expect(b2.eq(b6)).toEqual(false);

    expect(b3.eq(b1)).toEqual(true);
    expect(b3.eq(b2)).toEqual(false);
    expect(b3.eq(b3)).toEqual(true);
    expect(b3.eq(b4)).toEqual(false);
    expect(b3.eq(b5)).toEqual(false);
    expect(b3.eq(b6)).toEqual(false);

    expect(b4.eq(b1)).toEqual(false);
    expect(b4.eq(b2)).toEqual(true);
    expect(b4.eq(b3)).toEqual(false);
    expect(b4.eq(b4)).toEqual(true);
    expect(b4.eq(b5)).toEqual(false);
    expect(b4.eq(b6)).toEqual(false);

    expect(b5.eq(b1)).toEqual(false);
    expect(b5.eq(b2)).toEqual(false);
    expect(b5.eq(b3)).toEqual(false);
    expect(b5.eq(b4)).toEqual(false);
    expect(b5.eq(b5)).toEqual(true);
    expect(b5.eq(b6)).toEqual(false);

    expect(b6.eq(b1)).toEqual(false);
    expect(b6.eq(b2)).toEqual(false);
    expect(b6.eq(b3)).toEqual(false);
    expect(b6.eq(b4)).toEqual(false);
    expect(b6.eq(b5)).toEqual(false);
    expect(b6.eq(b6)).toEqual(true);
});

test("BitSet.isSubsetOf", () => {
    const b1 = Bitset.fromElements([0]);
    const b2 = Bitset.fromElements([1]);
    const b3 = Bitset.fromElements([0, 0]);
    const b4 = Bitset.fromElements([1, 0]);
    const b5 = Bitset.fromElements([0, 1]);
    const b6 = Bitset.fromElements([1, 1]);

    expect(b1.isSubsetOf(b1)).toEqual(true);
    expect(b1.isSubsetOf(b2)).toEqual(true);
    expect(b1.isSubsetOf(b3)).toEqual(true);
    expect(b1.isSubsetOf(b4)).toEqual(true);
    expect(b1.isSubsetOf(b5)).toEqual(true);
    expect(b1.isSubsetOf(b6)).toEqual(true);

    expect(b2.isSubsetOf(b1)).toEqual(false);
    expect(b2.isSubsetOf(b2)).toEqual(true);
    expect(b2.isSubsetOf(b3)).toEqual(false);
    expect(b2.isSubsetOf(b4)).toEqual(true);
    expect(b2.isSubsetOf(b5)).toEqual(false);
    expect(b2.isSubsetOf(b6)).toEqual(true);

    expect(b3.isSubsetOf(b1)).toEqual(true);
    expect(b3.isSubsetOf(b2)).toEqual(true);
    expect(b3.isSubsetOf(b3)).toEqual(true);
    expect(b3.isSubsetOf(b4)).toEqual(true);
    expect(b3.isSubsetOf(b5)).toEqual(true);
    expect(b3.isSubsetOf(b6)).toEqual(true);

    expect(b4.isSubsetOf(b1)).toEqual(false);
    expect(b4.isSubsetOf(b2)).toEqual(true);
    expect(b4.isSubsetOf(b3)).toEqual(false);
    expect(b4.isSubsetOf(b4)).toEqual(true);
    expect(b4.isSubsetOf(b5)).toEqual(false);
    expect(b4.isSubsetOf(b6)).toEqual(true);

    expect(b5.isSubsetOf(b1)).toEqual(false);
    expect(b5.isSubsetOf(b2)).toEqual(false);
    expect(b5.isSubsetOf(b3)).toEqual(false);
    expect(b5.isSubsetOf(b4)).toEqual(false);
    expect(b5.isSubsetOf(b5)).toEqual(true);
    expect(b5.isSubsetOf(b6)).toEqual(true);

    expect(b6.isSubsetOf(b1)).toEqual(false);
    expect(b6.isSubsetOf(b2)).toEqual(false);
    expect(b6.isSubsetOf(b3)).toEqual(false);
    expect(b6.isSubsetOf(b4)).toEqual(false);
    expect(b6.isSubsetOf(b5)).toEqual(false);
    expect(b6.isSubsetOf(b6)).toEqual(true);
});
