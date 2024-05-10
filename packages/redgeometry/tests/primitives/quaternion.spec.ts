import { expect, test } from "vitest";
import { Matrix4A } from "../../src/primitives/matrix.js";
import { Point3 } from "../../src/primitives/point.js";
import { Quaternion, RotationOrder } from "../../src/primitives/quaternion.js";
import { Vector3 } from "../../src/primitives/vector.js";
import {
    expectToBeCloseEuler,
    expectToBeClosePoint3,
    expectToBeCloseQuaternion,
    expectToBeCloseVector3,
} from "../expect.js";

test("Quaternion - fromRotationAngleX", () => {
    const a = 1;
    const q = Quaternion.fromRotationAngleX(a);

    const q1 = Quaternion.fromRotationEuler(a, 0, 0, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(a, 0, 0, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(a, 0, 0, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(a, 0, 0, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(a, 0, 0, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(a, 0, 0, RotationOrder.ZYX);

    expectToBeCloseQuaternion(q, q1);
    expectToBeCloseQuaternion(q, q2);
    expectToBeCloseQuaternion(q, q3);
    expectToBeCloseQuaternion(q, q4);
    expectToBeCloseQuaternion(q, q5);
    expectToBeCloseQuaternion(q, q6);
});

test("Quaternion - fromRotationAngleY", () => {
    const a = 1;
    const q = Quaternion.fromRotationAngleY(a);

    const q1 = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(0, a, 0, RotationOrder.ZYX);

    expectToBeCloseQuaternion(q, q1);
    expectToBeCloseQuaternion(q, q2);
    expectToBeCloseQuaternion(q, q3);
    expectToBeCloseQuaternion(q, q4);
    expectToBeCloseQuaternion(q, q5);
    expectToBeCloseQuaternion(q, q6);
    expectToBeCloseQuaternion(q, q6);
});

test("Quaternion - fromRotationAngleZ", () => {
    const a = 1;
    const q = Quaternion.fromRotationAngleZ(a);

    const q1 = Quaternion.fromRotationEuler(0, 0, a, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(0, 0, a, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(0, 0, a, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(0, 0, a, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(0, 0, a, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(0, 0, a, RotationOrder.ZYX);

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
    const qa2 = Quaternion.createIdentity();
    qa2.rotateX(ax);
    qa2.rotateY(ay);
    qa2.rotateZ(az);
    const qa3 = Quaternion.createIdentity();
    qa3.rotateZPre(az);
    qa3.rotateYPre(ay);
    qa3.rotateXPre(ax);

    const qb1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.XZY);
    const qb2 = Quaternion.createIdentity();
    qb2.rotateX(ax);
    qb2.rotateZ(az);
    qb2.rotateY(ay);
    const qb3 = Quaternion.createIdentity();
    qb3.rotateYPre(ay);
    qb3.rotateZPre(az);
    qb3.rotateXPre(ax);

    const qc1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YXZ);
    const qc2 = Quaternion.createIdentity();
    qc2.rotateY(ay);
    qc2.rotateX(ax);
    qc2.rotateZ(az);
    const qc3 = Quaternion.createIdentity();
    qc3.rotateZPre(az);
    qc3.rotateXPre(ax);
    qc3.rotateYPre(ay);

    const qd1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YZX);
    const qd2 = Quaternion.createIdentity();
    qd2.rotateY(ay);
    qd2.rotateZ(az);
    qd2.rotateX(ax);
    const qd3 = Quaternion.createIdentity();
    qd3.rotateXPre(ax);
    qd3.rotateZPre(az);
    qd3.rotateYPre(ay);

    const qe1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZXY);
    const qe2 = Quaternion.createIdentity();
    qe2.rotateZ(az);
    qe2.rotateX(ax);
    qe2.rotateY(ay);
    const qe3 = Quaternion.createIdentity();
    qe3.rotateYPre(ay);
    qe3.rotateXPre(ax);
    qe3.rotateZPre(az);

    const qf1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZYX);
    const qf2 = Quaternion.createIdentity();
    qf2.rotateZ(az);
    qf2.rotateY(ay);
    qf2.rotateX(ax);
    const qf3 = Quaternion.createIdentity();
    qf3.rotateXPre(ax);
    qf3.rotateYPre(ay);
    qf3.rotateZPre(az);

    expectToBeCloseQuaternion(qa1, qa2);
    expectToBeCloseQuaternion(qa1, qa3);
    expectToBeCloseQuaternion(qb1, qb2);
    expectToBeCloseQuaternion(qb1, qb3);
    expectToBeCloseQuaternion(qc1, qc2);
    expectToBeCloseQuaternion(qc1, qc3);
    expectToBeCloseQuaternion(qd1, qd2);
    expectToBeCloseQuaternion(qd1, qd3);
    expectToBeCloseQuaternion(qe1, qe2);
    expectToBeCloseQuaternion(qe1, qe3);
    expectToBeCloseQuaternion(qf1, qf2);
    expectToBeCloseQuaternion(qf1, qf3);
});

test("Quaternion - getEulerAngles", () => {
    // Pitch angle (y) must be in the range of `(-Math.PI / 2, Math.PI / 2)` to avoid gimbal lock
    const eul1 = { x: 0.5, y: 1, z: 2 };

    const q = Quaternion.fromRotationEuler(eul1.x, eul1.y, eul1.z, RotationOrder.XYZ);
    const eul2 = q.getEulerAngles();

    expectToBeCloseEuler(eul1, eul2);
});

test("Quaternion - inverse", () => {
    const q = new Quaternion(1, 2, 3, 4);
    const qInv = q.inverse();

    const q1 = q.mul(qInv);
    const q2 = qInv.mul(q);

    expectToBeCloseQuaternion(q1, Quaternion.createIdentity());
    expectToBeCloseQuaternion(q2, Quaternion.createIdentity());
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
    const qb = Quaternion.createIdentity();
    qb.rotateX(ax);
    qb.rotateY(ay);
    qb.rotateZ(az);
    const qc = Quaternion.createIdentity();
    qc.rotateZPre(az);
    qc.rotateYPre(ay);
    qc.rotateXPre(ax);
    const p = new Point3(1, 2, 3);
    const v = new Vector3(1, 2, 3);

    const p1 = mat3.mul(mat2).mul(mat1).mulPt3(p);
    const v1 = mat3.mul(mat2).mul(mat1).mulVec3(v);
    const p2 = q3.mul(q2).mul(q1).mulPt(p);
    const v2 = q3.mul(q2).mul(q1).mulVec(v);
    const p3 = qa.mulPt(p);
    const v3 = qa.mulVec(v);
    const p4 = qb.mulPt(p);
    const v4 = qb.mulVec(v);
    const p5 = qc.mulPt(p);
    const v5 = qc.mulVec(v);

    expectToBeClosePoint3(p1, p2);
    expectToBeCloseVector3(v1, v2);
    expectToBeClosePoint3(p1, p3);
    expectToBeCloseVector3(v1, v3);
    expectToBeClosePoint3(p1, p4);
    expectToBeCloseVector3(v1, v4);
    expectToBeClosePoint3(p1, p5);
    expectToBeCloseVector3(v1, v5);
    expect(p1).toEqual(v1);
    expect(p2).toEqual(v2);
    expect(p3).toEqual(v3);
    expect(p4).toEqual(v4);
});

test("Quaternion - rotateX", () => {
    const a = 1;
    const q1 = Quaternion.fromRotationAngleX(a);
    const q2 = Quaternion.fromRotationAngleX(a);

    q1.rotateX(-a);
    q2.rotateXPre(-a);

    expectToBeCloseQuaternion(q1, Quaternion.createIdentity());
    expectToBeCloseQuaternion(q2, Quaternion.createIdentity());
});

test("Quaternion - rotateY", () => {
    const a = 1;
    const q1 = Quaternion.fromRotationAngleY(a);
    const q2 = Quaternion.fromRotationAngleY(a);

    q1.rotateY(-a);
    q2.rotateYPre(-a);

    expectToBeCloseQuaternion(q1, Quaternion.createIdentity());
    expectToBeCloseQuaternion(q2, Quaternion.createIdentity());
});

test("Quaternion - rotateZ", () => {
    const a = 1;
    const q1 = Quaternion.fromRotationAngleZ(a);
    const q2 = Quaternion.fromRotationAngleZ(a);

    q1.rotateZ(-a);
    q2.rotateZPre(-a);

    expectToBeCloseQuaternion(q1, Quaternion.createIdentity());
    expectToBeCloseQuaternion(q2, Quaternion.createIdentity());
});
