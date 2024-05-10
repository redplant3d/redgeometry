import { expect } from "vitest";
import type { Complex } from "../src/primitives/complex.js";
import { Point2, Point3 } from "../src/primitives/point.js";
import { Quaternion } from "../src/primitives/quaternion.js";
import { Vector2, Vector3 } from "../src/primitives/vector.js";

export function expectToBeClosePoint2(p1: Point2, p2: Point2, numDigits?: number): void {
    expect(p1.x).toBeCloseTo(p2.x, numDigits ?? 15);
    expect(p1.y).toBeCloseTo(p2.y, numDigits ?? 15);
}

export function expectToBeClosePoint3(p1: Point3, p2: Point3, numDigits?: number): void {
    expect(p1.x).toBeCloseTo(p2.x, numDigits ?? 15);
    expect(p1.y).toBeCloseTo(p2.y, numDigits ?? 15);
    expect(p1.z).toBeCloseTo(p2.z, numDigits ?? 15);
}

export function expectToBeCloseVector2(v1: Vector2, v2: Vector2, numDigits?: number): void {
    expect(v1.x).toBeCloseTo(v2.x, numDigits ?? 15);
    expect(v1.y).toBeCloseTo(v2.y, numDigits ?? 15);
}

export function expectToBeCloseVector3(v1: Vector3, v2: Vector3, numDigits?: number): void {
    expect(v1.x).toBeCloseTo(v2.x, numDigits ?? 15);
    expect(v1.y).toBeCloseTo(v2.y, numDigits ?? 15);
    expect(v1.z).toBeCloseTo(v2.z, numDigits ?? 15);
}

export function expectToBeCloseComplex(z1: Complex, z2: Complex, numDigits?: number): void {
    expect(z1.a).toBeCloseTo(z2.a, numDigits ?? 15);
    expect(z1.b).toBeCloseTo(z2.b, numDigits ?? 15);
}

export function expectToBeCloseQuaternion(q1: Quaternion, q2: Quaternion, numDigits?: number): void {
    expect(q1.a).toBeCloseTo(q2.a, numDigits ?? 15);
    expect(q1.b).toBeCloseTo(q2.b, numDigits ?? 15);
    expect(q1.c).toBeCloseTo(q2.c, numDigits ?? 15);
    expect(q1.d).toBeCloseTo(q2.d, numDigits ?? 15);
}

export function expectToBeCloseEuler(
    eul1: { x: number; y: number; z: number },
    eul2: { x: number; y: number; z: number },
    numDigits?: number,
): void {
    const tau = 2 * Math.PI;

    const eul1x = (eul1.x + tau) % tau;
    const eul1y = (eul1.y + tau) % tau;
    const eul1z = (eul1.z + tau) % tau;

    const eul2x = (eul2.x + tau) % tau;
    const eul2y = (eul2.y + tau) % tau;
    const eul2z = (eul2.z + tau) % tau;

    console.log(eul1x, eul2x);
    console.log(eul1y, eul2y);
    console.log(eul1z, eul2z);

    expect(eul1x).toBeCloseTo(eul2x, numDigits ?? 15);
    expect(eul1y).toBeCloseTo(eul2y, numDigits ?? 15);
    expect(eul1z).toBeCloseTo(eul2z, numDigits ?? 15);
}
