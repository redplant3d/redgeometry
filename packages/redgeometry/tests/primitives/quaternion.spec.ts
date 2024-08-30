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
    qa2.rotateXPre(ax);
    qa2.rotateYPre(ay);
    qa2.rotateZPre(az);
    const qa3 = Quaternion.createIdentity();
    qa3.rotateZ(az);
    qa3.rotateY(ay);
    qa3.rotateX(ax);

    const qb1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.XZY);
    const qb2 = Quaternion.createIdentity();
    qb2.rotateXPre(ax);
    qb2.rotateZPre(az);
    qb2.rotateYPre(ay);
    const qb3 = Quaternion.createIdentity();
    qb3.rotateY(ay);
    qb3.rotateZ(az);
    qb3.rotateX(ax);

    const qc1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YXZ);
    const qc2 = Quaternion.createIdentity();
    qc2.rotateYPre(ay);
    qc2.rotateXPre(ax);
    qc2.rotateZPre(az);
    const qc3 = Quaternion.createIdentity();
    qc3.rotateZ(az);
    qc3.rotateX(ax);
    qc3.rotateY(ay);

    const qd1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.YZX);
    const qd2 = Quaternion.createIdentity();
    qd2.rotateYPre(ay);
    qd2.rotateZPre(az);
    qd2.rotateXPre(ax);
    const qd3 = Quaternion.createIdentity();
    qd3.rotateX(ax);
    qd3.rotateZ(az);
    qd3.rotateY(ay);

    const qe1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZXY);
    const qe2 = Quaternion.createIdentity();
    qe2.rotateZPre(az);
    qe2.rotateXPre(ax);
    qe2.rotateYPre(ay);
    const qe3 = Quaternion.createIdentity();
    qe3.rotateY(ay);
    qe3.rotateX(ax);
    qe3.rotateZ(az);

    const qf1 = Quaternion.fromRotationEuler(ax, ay, az, RotationOrder.ZYX);
    const qf2 = Quaternion.createIdentity();
    qf2.rotateZPre(az);
    qf2.rotateYPre(ay);
    qf2.rotateXPre(ax);
    const qf3 = Quaternion.createIdentity();
    qf3.rotateX(ax);
    qf3.rotateY(ay);
    qf3.rotateZ(az);

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

    const eul1 = q1.getEulerAngles(RotationOrder.XYZ);
    const eul2 = q2.getEulerAngles(RotationOrder.XZY);
    const eul3 = q3.getEulerAngles(RotationOrder.YXZ);
    const eul4 = q4.getEulerAngles(RotationOrder.YZX);
    const eul5 = q5.getEulerAngles(RotationOrder.ZXY);
    const eul6 = q6.getEulerAngles(RotationOrder.ZYX);

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

    expectToBeCloseQuaternion(q1, Quaternion.createIdentity());
    expectToBeCloseQuaternion(q2, Quaternion.createIdentity());
});

test("Quaternion - mulPt/mulVec", () => {
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
    qb.rotateX(ax);
    qb.rotateY(ay);
    qb.rotateZ(az);
    const qc = Quaternion.createIdentity();
    qc.rotateZPre(az);
    qc.rotateYPre(ay);
    qc.rotateXPre(ax);

    const p = new Point3(1, 2, 3);
    const v = new Vector3(1, 2, 3);

    const p1 = mat3.mul(mat2).mul(mat1).mulP(p);
    const v1 = mat3.mul(mat2).mul(mat1).mulV(v);
    const p2 = q3.mul(q2).mul(q1).mulP(p);
    const v2 = q3.mul(q2).mul(q1).mulV(v);
    const p3 = qa.mulP(p);
    const v3 = qa.mulV(v);
    const p4 = qb.mulP(p);
    const v4 = qb.mulV(v);
    const p5 = qc.mulP(p);
    const v5 = qc.mulV(v);

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
