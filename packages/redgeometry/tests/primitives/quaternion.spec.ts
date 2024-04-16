import { expect, test } from "vitest";
import { Matrix4A } from "../../src/primitives/matrix.js";
import { Point3 } from "../../src/primitives/point.js";
import { Quaternion, RotationOrder } from "../../src/primitives/quaternion.js";
import { Vector3 } from "../../src/primitives/vector.js";
import { expectToBeClosePoint3, expectToBeCloseQuaternion, expectToBeCloseVector3 } from "../expect.js";

test("Quaternion - fromRotationAngleX", () => {
    const q = Quaternion.fromRotationAngleX(1);

    const q1 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(1, 0, 0, RotationOrder.ZYX);

    expectToBeCloseQuaternion(q, q1);
    expectToBeCloseQuaternion(q, q2);
    expectToBeCloseQuaternion(q, q3);
    expectToBeCloseQuaternion(q, q4);
    expectToBeCloseQuaternion(q, q5);
    expectToBeCloseQuaternion(q, q6);
});

test("Quaternion - fromRotationAngleY", () => {
    const q = Quaternion.fromRotationAngleY(1);

    const q1 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(0, 1, 0, RotationOrder.ZYX);

    expectToBeCloseQuaternion(q, q1);
    expectToBeCloseQuaternion(q, q2);
    expectToBeCloseQuaternion(q, q3);
    expectToBeCloseQuaternion(q, q4);
    expectToBeCloseQuaternion(q, q5);
    expectToBeCloseQuaternion(q, q6);
    expectToBeCloseQuaternion(q, q6);
});

test("Quaternion - fromRotationAngleZ", () => {
    const q = Quaternion.fromRotationAngleZ(1);

    const q1 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(0, 0, 1, RotationOrder.ZYX);

    expectToBeCloseQuaternion(q, q1);
    expectToBeCloseQuaternion(q, q2);
    expectToBeCloseQuaternion(q, q3);
    expectToBeCloseQuaternion(q, q4);
    expectToBeCloseQuaternion(q, q5);
    expectToBeCloseQuaternion(q, q6);
});

test("Quaternion - fromRotationEuler", () => {
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

    expectToBeCloseQuaternion(qa1, qa2);
    expectToBeCloseQuaternion(qb1, qb2);
    expectToBeCloseQuaternion(qc1, qc2);
    expectToBeCloseQuaternion(qd1, qd2);
    expectToBeCloseQuaternion(qe1, qe2);
    expectToBeCloseQuaternion(qf1, qf2);

    const qa3 = Quaternion.fromRotationAngleZ(az).rotateYPre(ay).rotateXPre(ax);
    const qb3 = Quaternion.fromRotationAngleY(ay).rotateZPre(az).rotateXPre(ax);
    const qc3 = Quaternion.fromRotationAngleZ(az).rotateXPre(ax).rotateYPre(ay);
    const qd3 = Quaternion.fromRotationAngleX(ax).rotateZPre(az).rotateYPre(ay);
    const qe3 = Quaternion.fromRotationAngleY(ay).rotateXPre(ax).rotateZPre(az);
    const qf3 = Quaternion.fromRotationAngleX(ax).rotateYPre(ay).rotateZPre(az);

    expectToBeCloseQuaternion(qa1, qa3);
    expectToBeCloseQuaternion(qb1, qb3);
    expectToBeCloseQuaternion(qc1, qc3);
    expectToBeCloseQuaternion(qd1, qd3);
    expectToBeCloseQuaternion(qe1, qe3);
    expectToBeCloseQuaternion(qf1, qf3);
});

test("Quaternion - inverse", () => {
    const q = new Quaternion(1, 2, 3, 4);
    const qInv = q.inverse();

    const q1 = q.mul(qInv);
    const q2 = qInv.mul(q);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});

test("Quaternion - mulPt/mulVec", () => {
    const ax = 1;
    const ay = 2;
    const az = 3;
    const q1 = Quaternion.fromRotationAngleX(ax);
    const q2 = Quaternion.fromRotationAngleY(ay);
    const q3 = Quaternion.fromRotationAngleZ(az);
    const mat1 = Matrix4A.fromRotation(q1.a, q1.b, q1.c, q1.d);
    const mat2 = Matrix4A.fromRotation(q2.a, q2.b, q2.c, q2.d);
    const mat3 = Matrix4A.fromRotation(q3.a, q3.b, q3.c, q3.d);
    const qa = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.XYZ);
    const qb = Quaternion.fromRotationAngleX(ax).rotateY(ay).rotateZ(az);
    const qc = Quaternion.fromRotationAngleZ(az).rotateYPre(ay).rotateXPre(ax);
    const p = new Point3(1, 2, 3);
    const v = new Vector3(1, 2, 3);

    const p1 = mat3.mul(mat2).mul(mat1).mulPt(p);
    const v1 = mat3.mul(mat2).mul(mat1).mulVec(v);
    const p2 = q3.mul(q2).mul(q1).mulPt(p);
    const v2 = q3.mul(q2).mul(q1).mulVec(v);

    expectToBeClosePoint3(p1, p2);
    expectToBeCloseVector3(v1, v2);
    expect(p1).toEqual(v1);
    expect(p2).toEqual(v2);

    const p3 = qa.mulPt(p);
    const v3 = qa.mulVec(v);
    const p4 = qb.mulPt(p);
    const v4 = qb.mulVec(v);
    const p5 = qc.mulPt(p);
    const v5 = qc.mulVec(v);

    expectToBeClosePoint3(p1, p3);
    expectToBeCloseVector3(v1, v3);
    expectToBeClosePoint3(p1, p4);
    expectToBeCloseVector3(v1, v4);
    expectToBeClosePoint3(p1, p5);
    expectToBeCloseVector3(v1, v5);
    expect(p3).toEqual(v3);
    expect(p4).toEqual(v4);
});

test("Quaternion - rotateX", () => {
    const a = 1;
    const q = Quaternion.fromRotationAngleX(a);

    const q1 = q.rotateX(-a);
    const q2 = q.rotateXPre(-a);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});

test("Quaternion - rotateY", () => {
    const a = 1;
    const q = Quaternion.fromRotationAngleY(a);

    const q1 = q.rotateY(-a);
    const q2 = q.rotateYPre(-a);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});

test("Quaternion - rotateZ", () => {
    const a = 1;
    const q = Quaternion.fromRotationAngleZ(a);

    const q1 = q.rotateZ(-a);
    const q2 = q.rotateZPre(-a);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});
