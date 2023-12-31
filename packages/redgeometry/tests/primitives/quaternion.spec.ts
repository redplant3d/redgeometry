import { expect, test } from "vitest";
import { Quaternion, RotationOrder } from "../../src/primitives/quaternion.js";

test("Quaternion - fromXAngle", () => {
    const q = Quaternion.fromRotationAngleX(1);

    const q1 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.ZYX);

    expectToBeCloseToQuaternion(q, q1);
    expectToBeCloseToQuaternion(q, q2);
    expectToBeCloseToQuaternion(q, q3);
    expectToBeCloseToQuaternion(q, q4);
    expectToBeCloseToQuaternion(q, q5);
    expectToBeCloseToQuaternion(q, q6);
});

test("Quaternion - fromYAngle", () => {
    const q = Quaternion.fromRotationAngleY(1);

    const q1 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.ZYX);

    expectToBeCloseToQuaternion(q, q1);
    expectToBeCloseToQuaternion(q, q2);
    expectToBeCloseToQuaternion(q, q3);
    expectToBeCloseToQuaternion(q, q4);
    expectToBeCloseToQuaternion(q, q5);
    expectToBeCloseToQuaternion(q, q6);
    expectToBeCloseToQuaternion(q, q6);
});

test("Quaternion - fromZAngle", () => {
    const q = Quaternion.fromRotationAngleZ(1);

    const q1 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.ZYX);

    expectToBeCloseToQuaternion(q, q1);
    expectToBeCloseToQuaternion(q, q2);
    expectToBeCloseToQuaternion(q, q3);
    expectToBeCloseToQuaternion(q, q4);
    expectToBeCloseToQuaternion(q, q5);
    expectToBeCloseToQuaternion(q, q6);
});

test("Quaternion - fromEulerAngles", () => {
    const ax = 1;
    const ay = 2;
    const az = 3;

    const qa1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.XYZ);
    const qb1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.XZY);
    const qc1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YXZ);
    const qd1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YZX);
    const qe1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZXY);
    const qf1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZYX);

    const qa2 = Quaternion.fromRotationAngleX(ax).rotateY(ay).rotateZ(az);
    const qb2 = Quaternion.fromRotationAngleX(ax).rotateZ(az).rotateY(ay);
    const qc2 = Quaternion.fromRotationAngleY(ay).rotateX(ax).rotateZ(az);
    const qd2 = Quaternion.fromRotationAngleY(ay).rotateZ(az).rotateX(ax);
    const qe2 = Quaternion.fromRotationAngleZ(az).rotateX(ax).rotateY(ay);
    const qf2 = Quaternion.fromRotationAngleZ(az).rotateY(ay).rotateX(ax);

    expectToBeCloseToQuaternion(qa1, qa2);
    expectToBeCloseToQuaternion(qb1, qb2);
    expectToBeCloseToQuaternion(qc1, qc2);
    expectToBeCloseToQuaternion(qd1, qd2);
    expectToBeCloseToQuaternion(qe1, qe2);
    expectToBeCloseToQuaternion(qf1, qf2);
});

function expectToBeCloseToQuaternion(q1: Quaternion, q2: Quaternion): void {
    expect(q1.a).toBeCloseTo(q2.a, 15);
    expect(q1.a).toBeCloseTo(q2.a, 15);
    expect(q1.a).toBeCloseTo(q2.a, 15);
    expect(q1.a).toBeCloseTo(q2.a, 15);
}
