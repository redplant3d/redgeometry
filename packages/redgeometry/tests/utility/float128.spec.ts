import { expect, test } from "vitest";
import { Float128 } from "../../src/utility/float128.js";

test("add", () => {
    const f0 = Float128.from(0);
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);
    const f4 = Float128.from(4);

    expect(f0.add(f0)).toEqual(f0);
    expect(f1.add(f1)).toEqual(f2);
    expect(f2.add(f2)).toEqual(f4);
});

test("add64", () => {
    const f0 = Float128.from(0);
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);
    const f4 = Float128.from(4);

    expect(f0.add64(0)).toEqual(f0);
    expect(f1.add64(1)).toEqual(f2);
    expect(f2.add64(2)).toEqual(f4);
});

test("mul", () => {
    const f0 = Float128.from(0);
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);
    const f4 = Float128.from(4);

    expect(f0.mul(f0)).toEqual(f0);
    expect(f1.mul(f1)).toEqual(f1);
    expect(f1.mul(f2)).toEqual(f2);
    expect(f2.mul(f2)).toEqual(f4);
});

test("mul64", () => {
    const f0 = Float128.from(0);
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);
    const f4 = Float128.from(4);

    expect(f0.mul64(0)).toEqual(f0);
    expect(f1.mul64(1)).toEqual(f1);
    expect(f1.mul64(2)).toEqual(f2);
    expect(f2.mul64(2)).toEqual(f4);
});

test("neg", () => {
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);

    const neg1 = Float128.from(-1);
    const neg2 = Float128.from(-2);

    expect(f1.neg().value()).toEqual(neg1.value());
    expect(f2.neg().value()).toEqual(neg2.value());
});

test("sub", () => {
    const f0 = Float128.from(0);
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);
    const f4 = Float128.from(4);

    expect(f0.sub(f0)).toEqual(f0);
    expect(f1.sub(f1)).toEqual(f0);
    expect(f2.sub(f1)).toEqual(f1);
    expect(f4.sub(f2)).toEqual(f2);
});

test("sub64", () => {
    const f0 = Float128.from(0);
    const f1 = Float128.from(1);
    const f2 = Float128.from(2);
    const f4 = Float128.from(4);

    expect(f0.sub64(0)).toEqual(f0);
    expect(f1.sub64(1)).toEqual(f0);
    expect(f2.sub64(1)).toEqual(f1);
    expect(f4.sub64(2)).toEqual(f2);
});
