import { expect, test } from "vitest";
import { Complex } from "../../src/index.js";
import { Matrix3x2, Matrix3x3, Matrix4x3, Matrix4x4 } from "../../src/primitives/matrix.js";
import { Point2, Point3 } from "../../src/primitives/point.js";
import { Quaternion } from "../../src/primitives/quaternion.js";
import { Vector2, Vector3 } from "../../src/primitives/vector.js";

test("Matrix3x2 - inverse", () => {
    const c = Complex.fromRotationAngle(Math.PI);
    const mat = Matrix3x2.createIdentity();
    mat.translatePre(1, 2);
    mat.scalePre(4, 4);
    mat.rotatePre(c.a, c.b);

    const matInv = mat.getInverse();
    mat.mul(matInv);

    expect(mat).toEqual(Matrix3x2.createIdentity());
});

test("Matrix3x2 - mapPoint", () => {
    const mat = Matrix3x2.createIdentity();
    const p = new Point2(1, 2);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix3x2 - mapVector", () => {
    const mat = Matrix3x2.createIdentity();
    const v = new Vector2(1, 2);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix3x2 - rotate", () => {
    const c = Complex.fromRotationAngle(1);
    const mat1 = Matrix3x2.createIdentity();
    const mat2 = Matrix3x2.createIdentity();
    const mat3 = Matrix3x2.createIdentity();

    mat1.rotatePost(c.a, c.b);
    mat2.rotatePre(c.a, c.b);
    mat3.rotateSet(c.a, c.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x2 - scale", () => {
    const mat1 = Matrix3x2.createIdentity();
    const mat2 = Matrix3x2.createIdentity();
    const mat3 = Matrix3x2.createIdentity();

    mat1.scalePost(1, 2);
    mat2.scalePre(1, 2);
    mat3.scaleSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x2 - translate", () => {
    const mat1 = Matrix3x2.createIdentity();
    const mat2 = Matrix3x2.createIdentity();
    const mat3 = Matrix3x2.createIdentity();

    mat1.translatePost(1, 2);
    mat2.translatePre(1, 2);
    mat3.translateSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x3 - inverse", () => {
    const c = Complex.fromRotationAngle(Math.PI);
    const mat = Matrix3x3.createIdentity();
    mat.translatePre(1, 2);
    mat.scalePre(4, 4);
    mat.rotatePre(c.a, c.b);

    const matInv = mat.getInverse();
    mat.mul(matInv);

    expect(mat).toEqual(Matrix3x3.createIdentity());
});

test("Matrix3x3 - mapPoint", () => {
    const mat = Matrix3x3.createIdentity();
    const p = new Point2(1, 2);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix3x3 - mapVector", () => {
    const mat = Matrix3x3.createIdentity();
    const v = new Vector2(1, 2);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix3x3 - rotate", () => {
    const c = Complex.fromRotationAngle(1);
    const mat1 = Matrix3x3.createIdentity();
    const mat2 = Matrix3x3.createIdentity();
    const mat3 = Matrix3x3.createIdentity();

    mat1.rotatePost(c.a, c.b);
    mat2.rotatePre(c.a, c.b);
    mat3.rotateSet(c.a, c.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x3 - scale", () => {
    const mat1 = Matrix3x3.createIdentity();
    const mat2 = Matrix3x3.createIdentity();
    const mat3 = Matrix3x3.createIdentity();

    mat1.scalePost(1, 2);
    mat2.scalePre(1, 2);
    mat3.scaleSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x3 - translate", () => {
    const mat1 = Matrix3x3.createIdentity();
    const mat2 = Matrix3x3.createIdentity();
    const mat3 = Matrix3x3.createIdentity();

    mat1.translatePost(1, 2);
    mat2.translatePre(1, 2);
    mat3.translateSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4x3 - mapPoint", () => {
    const mat = Matrix4x3.createIdentity();
    const p = new Point3(1, 2, 3);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix4x3 - mapVector", () => {
    const mat = Matrix4x3.createIdentity();
    const v = new Vector3(1, 2, 3);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix4x3 - rotate (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);
    const mat1 = Matrix4x3.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4x3.createIdentity();
    const mat3 = Matrix4x3.createIdentity();
    const mat4 = Matrix4x3.createIdentity();

    mat2.rotatePost(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x3 - rotate (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);
    const mat1 = Matrix4x3.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4x3.createIdentity();
    const mat3 = Matrix4x3.createIdentity();
    const mat4 = Matrix4x3.createIdentity();

    mat2.rotatePost(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x3 - rotate (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);
    const mat1 = Matrix4x3.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4x3.createIdentity();
    const mat3 = Matrix4x3.createIdentity();
    const mat4 = Matrix4x3.createIdentity();

    mat2.rotatePost(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x3 - scale", () => {
    const mat1 = Matrix4x3.fromScale(1, 2, 3);
    const mat2 = Matrix4x3.createIdentity();
    const mat3 = Matrix4x3.createIdentity();
    const mat4 = Matrix4x3.createIdentity();

    mat2.scalePost(1, 2, 3);
    mat3.scalePre(1, 2, 3);
    mat4.scaleSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x3 - translate", () => {
    const mat1 = Matrix4x3.fromTranslation(1, 2, 3);
    const mat2 = Matrix4x3.createIdentity();
    const mat3 = Matrix4x3.createIdentity();
    const mat4 = Matrix4x3.createIdentity();

    mat2.translatePost(1, 2, 3);
    mat3.translatePre(1, 2, 3);
    mat4.translateSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x4 - mapPoint", () => {
    const mat = Matrix4x4.createIdentity();
    const p = new Point3(1, 2, 3);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix4x4 - mapVector", () => {
    const mat = Matrix4x4.createIdentity();
    const v = new Vector3(1, 2, 3);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix4x4 - rotate (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);
    const mat1 = Matrix4x4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4x4.createIdentity();
    const mat3 = Matrix4x4.createIdentity();
    const mat4 = Matrix4x4.createIdentity();

    mat2.rotatePost(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x4 - rotate (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);
    const mat1 = Matrix4x4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4x4.createIdentity();
    const mat3 = Matrix4x4.createIdentity();
    const mat4 = Matrix4x4.createIdentity();

    mat2.rotatePost(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x4 - rotate (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);
    const mat1 = Matrix4x4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4x4.createIdentity();
    const mat3 = Matrix4x4.createIdentity();
    const mat4 = Matrix4x4.createIdentity();

    mat2.rotatePost(q.a, q.b, q.c, q.d);
    mat3.rotatePre(q.a, q.b, q.c, q.d);
    mat4.rotateSet(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x4 - scale", () => {
    const mat1 = Matrix4x4.fromScale(1, 2, 3);
    const mat2 = Matrix4x4.createIdentity();
    const mat3 = Matrix4x4.createIdentity();
    const mat4 = Matrix4x4.createIdentity();

    mat2.scalePost(1, 2, 3);
    mat3.scalePre(1, 2, 3);
    mat4.scaleSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4x4 - translate", () => {
    const mat1 = Matrix4x4.fromTranslation(1, 2, 3);
    const mat2 = Matrix4x4.createIdentity();
    const mat3 = Matrix4x4.createIdentity();
    const mat4 = Matrix4x4.createIdentity();

    mat2.translatePost(1, 2, 3);
    mat3.translatePre(1, 2, 3);
    mat4.translateSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});
