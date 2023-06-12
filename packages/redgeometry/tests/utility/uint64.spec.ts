import { expect, test } from "vitest";
import { Uint64 } from "../../src/utility/uint64.js";

test("add", () => {
    const u0 = Uint64.from(0);
    const u1 = Uint64.from(1);
    const u2 = Uint64.from(2);
    const u4 = Uint64.from(4);

    expect(u0.add(u0)).toEqual(u0);
    expect(u1.add(u1)).toEqual(u2);
    expect(u2.add(u2)).toEqual(u4);
});

test("and", () => {
    const u1 = new Uint64(0x10101111, 0x10101111);
    const u2 = new Uint64(0x01011111, 0x01011111);

    const and = new Uint64(0x00001111, 0x00001111);

    expect(u1.and(u2)).toEqual(and);
});

test("mul", () => {
    const u0 = Uint64.from(0);
    const u1 = Uint64.from(1);
    const u2 = Uint64.from(2);
    const u4 = Uint64.from(4);

    expect(u0.mul(u0)).toEqual(u0);
    expect(u1.mul(u1)).toEqual(u1);
    expect(u1.mul(u2)).toEqual(u2);
    expect(u2.mul(u2)).toEqual(u4);
});

test("neg", () => {
    const u0 = Uint64.from(0);
    const u1 = Uint64.from(1);
    const u2 = Uint64.from(2);

    const neg1 = new Uint64(0xffffffff, 0xffffffff);
    const neg2 = new Uint64(0xffffffff, 0xfffffffe);

    expect(u0.neg).toEqual(u0);
    expect(u1.neg).toEqual(neg1);
    expect(u2.neg).toEqual(neg2);
});

test("or", () => {
    const u1 = new Uint64(0x10101111, 0x10101111);
    const u2 = new Uint64(0x01011111, 0x01011111);

    const or = new Uint64(0x11111111, 0x11111111);

    expect(u1.or(u2)).toEqual(or);
});

test("rol", () => {
    const u = new Uint64(0x00001111, 0x00001111);

    const rol16 = new Uint64(0x11110000, 0x11110000);
    const rol32 = new Uint64(0x00001111, 0x00001111);
    const rol48 = new Uint64(0x11110000, 0x11110000);

    expect(u.rol(0)).toEqual(u);
    expect(u.rol(16)).toEqual(rol16);
    expect(u.rol(32)).toEqual(rol32);
    expect(u.rol(48)).toEqual(rol48);
    expect(u.rol(64)).toEqual(u);

    expect(u.rol(-16)).toEqual(rol48);
    expect(u.rol(-32)).toEqual(rol32);
    expect(u.rol(-48)).toEqual(rol16);
    expect(u.rol(-64)).toEqual(u);
});

test("ror", () => {
    const u = new Uint64(0x11110000, 0x11110000);

    const ror16 = new Uint64(0x00001111, 0x00001111);
    const ror32 = new Uint64(0x11110000, 0x11110000);
    const ror48 = new Uint64(0x00001111, 0x00001111);

    expect(u.ror(0)).toEqual(u);
    expect(u.ror(16)).toEqual(ror16);
    expect(u.ror(32)).toEqual(ror32);
    expect(u.ror(48)).toEqual(ror48);
    expect(u.ror(64)).toEqual(u);

    expect(u.ror(-16)).toEqual(ror48);
    expect(u.ror(-32)).toEqual(ror32);
    expect(u.ror(-48)).toEqual(ror16);
    expect(u.ror(-64)).toEqual(u);
});

test("shl", () => {
    const u = new Uint64(0x00001111, 0x00001111);

    const shl16 = new Uint64(0x11110000, 0x11110000);
    const shl32 = new Uint64(0x00001111, 0x00000000);
    const shl48 = new Uint64(0x11110000, 0x00000000);

    expect(u.shl(0)).toEqual(u);
    expect(u.shl(16)).toEqual(shl16);
    expect(u.shl(32)).toEqual(shl32);
    expect(u.shl(48)).toEqual(shl48);
    expect(u.shl(64)).toEqual(u);
});

test("shr", () => {
    const u = new Uint64(0x11110000, 0x11110000);

    const shr16 = new Uint64(0x00001111, 0x00001111);
    const shr32 = new Uint64(0x00000000, 0x11110000);
    const shr48 = new Uint64(0x00000000, 0x00001111);

    expect(u.shr(0)).toEqual(u);
    expect(u.shr(16)).toEqual(shr16);
    expect(u.shr(32)).toEqual(shr32);
    expect(u.shr(48)).toEqual(shr48);
    expect(u.shr(64)).toEqual(u);
});

test("sub", () => {
    const u0 = Uint64.from(0);
    const u1 = Uint64.from(1);
    const u2 = Uint64.from(2);
    const u4 = Uint64.from(4);

    expect(u0.sub(u0)).toEqual(u0);
    expect(u1.sub(u1)).toEqual(u0);
    expect(u2.sub(u1)).toEqual(u1);
    expect(u4.sub(u2)).toEqual(u2);
});

test("value", () => {
    const u1 = new Uint64(0x00000001, 0x00000000);
    const u2 = new Uint64(0x00000001, 0x00000001);

    expect(u1.value).toEqual(4294967296);
    expect(u2.value).toEqual(4294967297);
});

test("xor", () => {
    const u1 = new Uint64(0x10101111, 0x10101111);
    const u2 = new Uint64(0x01011111, 0x01011111);

    const xor = new Uint64(0x11110000, 0x11110000);

    expect(u1.xor(u2)).toEqual(xor);
});
