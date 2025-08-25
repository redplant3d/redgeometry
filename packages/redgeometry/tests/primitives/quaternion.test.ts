import { test } from "vitest";
import { Matrix4A } from "../../src/primitives/matrix.js";
import { Quaternion, RotationOrder } from "../../src/primitives/quaternion.js";
import { Vector3 } from "../../src/primitives/vector.js";
import { expectToBeCloseEuler, expectToBeCloseQuaternion, expectToBeCloseVector3 } from "../expect.js";

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
    qa2.setRotateXPre(qa2, ax);
    qa2.setRotateYPre(qa2, ay);
    qa2.setRotateZPre(qa2, az);
    const qa3 = Quaternion.createIdentity();
    qa3.setRotateZ(qa3, az);
    qa3.setRotateY(qa3, ay);
    qa3.setRotateX(qa3, ax);

    const qb1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.XZY);
    const qb2 = Quaternion.createIdentity();
    qb2.setRotateXPre(qb2, ax);
    qb2.setRotateZPre(qb2, az);
    qb2.setRotateYPre(qb2, ay);
    const qb3 = Quaternion.createIdentity();
    qb3.setRotateY(qb3, ay);
    qb3.setRotateZ(qb3, az);
    qb3.setRotateX(qb3, ax);

    const qc1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YXZ);
    const qc2 = Quaternion.createIdentity();
    qc2.setRotateYPre(qc2, ay);
    qc2.setRotateXPre(qc2, ax);
    qc2.setRotateZPre(qc2, az);
    const qc3 = Quaternion.createIdentity();
    qc3.setRotateZ(qc3, az);
    qc3.setRotateX(qc3, ax);
    qc3.setRotateY(qc3, ay);

    const qd1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YZX);
    const qd2 = Quaternion.createIdentity();
    qd2.setRotateYPre(qd2, ay);
    qd2.setRotateZPre(qd2, az);
    qd2.setRotateXPre(qd2, ax);
    const qd3 = Quaternion.createIdentity();
    qd3.setRotateX(qd3, ax);
    qd3.setRotateZ(qd3, az);
    qd3.setRotateY(qd3, ay);

    const qe1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZXY);
    const qe2 = Quaternion.createIdentity();
    qe2.setRotateZPre(qe2, az);
    qe2.setRotateXPre(qe2, ax);
    qe2.setRotateYPre(qe2, ay);
    const qe3 = Quaternion.createIdentity();
    qe3.setRotateY(qe3, ay);
    qe3.setRotateX(qe3, ax);
    qe3.setRotateZ(qe3, az);

    const qf1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZYX);
    const qf2 = Quaternion.createIdentity();
    qf2.setRotateZPre(qf2, az);
    qf2.setRotateYPre(qf2, ay);
    qf2.setRotateXPre(qf2, ax);
    const qf3 = Quaternion.createIdentity();
    qf3.setRotateX(qf3, ax);
    qf3.setRotateY(qf3, ay);
    qf3.setRotateZ(qf3, az);

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
    const eul = { x: 0.25, y: 0.5, z: 1 };

    const q1 = Quaternion.fromRotationEuler(eul.x, eul.y, eul.z, RotationOrder.XYZ);
    const q2 = Quaternion.fromRotationEuler(eul.x, eul.y, eul.z, RotationOrder.XZY);
    const q3 = Quaternion.fromRotationEuler(eul.x, eul.y, eul.z, RotationOrder.YXZ);
    const q4 = Quaternion.fromRotationEuler(eul.x, eul.y, eul.z, RotationOrder.YZX);
    const q5 = Quaternion.fromRotationEuler(eul.x, eul.y, eul.z, RotationOrder.ZXY);
    const q6 = Quaternion.fromRotationEuler(eul.x, eul.y, eul.z, RotationOrder.ZYX);

    const eul1 = q1.eulerAngles(RotationOrder.XYZ);
    const eul2 = q2.eulerAngles(RotationOrder.XZY);
    const eul3 = q3.eulerAngles(RotationOrder.YXZ);
    const eul4 = q4.eulerAngles(RotationOrder.YZX);
    const eul5 = q5.eulerAngles(RotationOrder.ZXY);
    const eul6 = q6.eulerAngles(RotationOrder.ZYX);

    expectToBeCloseEuler(eul, eul1);
    expectToBeCloseEuler(eul, eul2);
    expectToBeCloseEuler(eul, eul3);
    expectToBeCloseEuler(eul, eul4);
    expectToBeCloseEuler(eul, eul5);
    expectToBeCloseEuler(eul, eul6);
});

test("Quaternion - inverse", () => {
    const q = new Quaternion(1, 2, 3, 4);
    const qInv = q.inverse();

    const q1 = q.mul(qInv);
    const q2 = qInv.mul(q);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});

test("Quaternion - mulV", () => {
    const ax = 1;
    const ay = 2;
    const az = 3;

    // Extrinsic `XYZ` rotation
    const q1 = Quaternion.fromRotationAngleX(ax);
    const q2 = Quaternion.fromRotationAngleY(ay);
    const q3 = Quaternion.fromRotationAngleZ(az);
    const mat1 = Matrix4A.fromRotation(q1.a, q1.b, q1.c, q1.d);
    const mat2 = Matrix4A.fromRotation(q2.a, q2.b, q2.c, q2.d);
    const mat3 = Matrix4A.fromRotation(q3.a, q3.b, q3.c, q3.d);
    const qa = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZYX);
    const qb = Quaternion.createIdentity();
    qb.setRotateX(qb, ax);
    qb.setRotateY(qb, ay);
    qb.setRotateZ(qb, az);
    const qc = Quaternion.createIdentity();
    qc.setRotateZPre(qc, az);
    qc.setRotateYPre(qc, ay);
    qc.setRotateXPre(qc, ax);

    const v = new Vector3(1, 2, 3);

    const v1 = mat3.mul(mat2).mul(mat1).transformPoint(v);
    const v2 = q3.mul(q2).mul(q1).mulV(v);
    const v3 = qa.mulV(v);
    const v4 = qb.mulV(v);
    const v5 = qc.mulV(v);

    expectToBeCloseVector3(v1, v2);
    expectToBeCloseVector3(v1, v3);
    expectToBeCloseVector3(v1, v4);
    expectToBeCloseVector3(v1, v5);
});

test("Quaternion - setRotateX", () => {
    const a = 1;
    const q1 = Quaternion.fromRotationAngleX(a);
    const q2 = Quaternion.fromRotationAngleX(a);

    q1.setRotateX(q1, -a);
    q2.setRotateXPre(q2, -a);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});

test("Quaternion - setRotateY", () => {
    const a = 1;
    const q1 = Quaternion.fromRotationAngleY(a);
    const q2 = Quaternion.fromRotationAngleY(a);

    q1.setRotateY(q1, -a);
    q2.setRotateYPre(q2, -a);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});

test("Quaternion - setRotateZ", () => {
    const a = 1;
    const q1 = Quaternion.fromRotationAngleZ(a);
    const q2 = Quaternion.fromRotationAngleZ(a);

    q1.setRotateZ(q1, -a);
    q2.setRotateZPre(q2, -a);

    expectToBeCloseQuaternion(q1, Quaternion.IDENTITY);
    expectToBeCloseQuaternion(q2, Quaternion.IDENTITY);
});
