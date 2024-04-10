import { expect, test } from "vitest";
import { Complex } from "../../src/index.js";
import { Matrix3, Matrix3A, Matrix4, Matrix4A } from "../../src/primitives/matrix.js";
import { Point2, Point3 } from "../../src/primitives/point.js";
import { Quaternion } from "../../src/primitives/quaternion.js";
import { Vector2, Vector3 } from "../../src/primitives/vector.js";

test("Matrix3A - inverse", () => {
    const c = Complex.fromRotationAngle(Math.PI);
    const mat = Matrix3A.createIdentity();
    mat.translate(1, 2);
    mat.scale(4, 4);
    mat.rotate(c.a, c.b);

    const matInv = mat.getInverse();
    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix3A.createIdentity());
    expect(mat2).toEqual(Matrix3A.createIdentity());
});

test("Matrix3A - mapPoint", () => {
    const mat = Matrix3A.createIdentity();
    const p = new Point2(1, 2);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix3A - mapVector", () => {
    const mat = Matrix3A.createIdentity();
    const v = new Vector2(1, 2);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix3A - rotate", () => {
    const c = Complex.fromRotationAngle(1);
    const mat1 = Matrix3A.createIdentity();
    const mat2 = Matrix3A.createIdentity();
    const mat3 = Matrix3A.createIdentity();

    mat1.rotate(c.a, c.b);
    mat2.rotatePre(c.a, c.b);
    mat3.rotateSet(c.a, c.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3A - scale", () => {
    const mat1 = Matrix3A.createIdentity();
    const mat2 = Matrix3A.createIdentity();
    const mat3 = Matrix3A.createIdentity();

    mat1.scale(1, 2);
    mat2.scalePre(1, 2);
    mat3.scaleSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3A - translate", () => {
    const mat1 = Matrix3A.createIdentity();
    const mat2 = Matrix3A.createIdentity();
    const mat3 = Matrix3A.createIdentity();

    mat1.translate(1, 2);
    mat2.translatePre(1, 2);
    mat3.translateSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - inverse", () => {
    const c = Complex.fromRotationAngle(Math.PI);
    const mat = Matrix3.createIdentity();
    mat.translate(1, 2);
    mat.scale(4, 4);
    mat.rotate(c.a, c.b);

    const matInv = mat.getInverse();
    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix3.createIdentity());
    expect(mat2).toEqual(Matrix3.createIdentity());
});

test("Matrix3 - mapPoint", () => {
    const mat = Matrix3.createIdentity();
    const p = new Point2(1, 2);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix3 - mapVector", () => {
    const mat = Matrix3.createIdentity();
    const v = new Vector2(1, 2);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix3 - rotate", () => {
    const c = Complex.fromRotationAngle(1);
    const mat1 = Matrix3.createIdentity();
    const mat2 = Matrix3.createIdentity();
    const mat3 = Matrix3.createIdentity();

    mat1.rotate(c.a, c.b);
    mat2.rotatePre(c.a, c.b);
    mat3.rotateSet(c.a, c.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - scale", () => {
    const mat1 = Matrix3.createIdentity();
    const mat2 = Matrix3.createIdentity();
    const mat3 = Matrix3.createIdentity();

    mat1.scale(1, 2);
    mat2.scalePre(1, 2);
    mat3.scaleSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - translate", () => {
    const mat1 = Matrix3.createIdentity();
    const mat2 = Matrix3.createIdentity();
    const mat3 = Matrix3.createIdentity();

    mat1.translate(1, 2);
    mat2.translatePre(1, 2);
    mat3.translateSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4A - inverse", () => {
    const q = Quaternion.fromRotationAngleX(Math.PI);
    const mat = Matrix4A.createIdentity();
    mat.translate(1, 2, 3);
    mat.scale(4, 4, 4);
    mat.rotate(q.a, q.b, q.c, q.d);

    const matInv = mat.getInverse();
    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix4A.createIdentity());
    expect(mat2).toEqual(Matrix4A.createIdentity());
});

test("Matrix4A - mapPoint", () => {
    const mat = Matrix4A.createIdentity();
    const p = new Point3(1, 2, 3);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix4A - mapVector", () => {
    const mat = Matrix4A.createIdentity();
    const v = new Vector3(1, 2, 3);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix4A - rotate (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);
    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.rotate(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - rotate (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);
    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.rotate(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - rotate (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);
    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.rotate(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - scale", () => {
    const mat1 = Matrix4A.fromScale(1, 2, 3);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.scale(1, 2, 3);
    mat3.scalePre(1, 2, 3);
    mat4.scaleSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - translate", () => {
    const mat1 = Matrix4A.fromTranslation(1, 2, 3);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.translate(1, 2, 3);
    mat3.translatePre(1, 2, 3);
    mat4.translateSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - inverse", () => {
    const q = Quaternion.fromRotationAngleX(Math.PI);
    const mat = Matrix4.createIdentity();
    mat.translate(1, 2, 3);
    mat.scale(4, 4, 4);
    mat.rotate(q.a, q.b, q.c, q.d);

    const matInv = mat.getInverse();
    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix4.createIdentity());
    expect(mat2).toEqual(Matrix4.createIdentity());
});

test("Matrix4 - mapPoint", () => {
    const mat = Matrix4.createIdentity();
    const p = new Point3(1, 2, 3);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix4 - mapVector", () => {
    const mat = Matrix4.createIdentity();
    const v = new Vector3(1, 2, 3);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix4 - rotate (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);
    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.rotate(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - rotate (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);
    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.rotate(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - rotate (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);
    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.rotate(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - scale", () => {
    const mat1 = Matrix4.fromScale(1, 2, 3);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.scale(1, 2, 3);
    mat3.scalePre(1, 2, 3);
    mat4.scaleSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - translate", () => {
    const mat1 = Matrix4.fromTranslation(1, 2, 3);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.translate(1, 2, 3);
    mat3.translatePre(1, 2, 3);
    mat4.translateSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});
