import { expect, test } from "vitest";
import { Matrix3x2, Matrix3x3, Matrix4x4, Point2, Point3, Vector2, Vector3 } from "../../src/primitives";

test("Matrix3x2 - inverse", () => {
    const mat1 = Matrix3x2.identity;
    mat1.translatePre(1, 2);
    mat1.scalePre(4, 4);
    mat1.rotateAnglePre(Math.PI);
    const mat2 = mat1.inverse();

    const mat = mat1.mul(mat2);

    expect(mat).toEqual(Matrix3x2.identity);
});

test("Matrix3x2 - mapPoint", () => {
    const mat = Matrix3x2.identity;
    const p = new Point2(1, 2);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix3x2 - mapVector", () => {
    const mat = Matrix3x2.identity;
    const v = new Vector2(1, 2);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix3x2 - rotate", () => {
    const mat1 = Matrix3x2.identity;
    const mat2 = Matrix3x2.identity;
    const mat3 = Matrix3x2.identity;

    mat1.rotateAnglePost(1);
    mat2.rotateAnglePre(1);
    mat3.rotateAngleSet(1);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x2 - scale", () => {
    const mat1 = Matrix3x2.identity;
    const mat2 = Matrix3x2.identity;
    const mat3 = Matrix3x2.identity;

    mat1.scalePost(1, 2);
    mat2.scalePre(1, 2);
    mat3.scaleSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x2 - translate", () => {
    const mat1 = Matrix3x2.identity;
    const mat2 = Matrix3x2.identity;
    const mat3 = Matrix3x2.identity;

    mat1.translatePost(1, 2);
    mat2.translatePre(1, 2);
    mat3.translateSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x3 - inverse", () => {
    const mat1 = Matrix3x3.identity;
    mat1.translatePre(1, 2);
    mat1.scalePre(4, 4);
    mat1.rotateAnglePre(Math.PI);
    const mat2 = mat1.inverse();

    const m = mat1.mul(mat2);

    expect(m).toEqual(Matrix3x3.identity);
});

test("Matrix3x3 - mapPoint", () => {
    const mat = Matrix3x3.identity;
    const p = new Point2(1, 2);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix3x3 - mapVector", () => {
    const mat = Matrix3x3.identity;
    const v = new Vector2(1, 2);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix3x3 - rotate", () => {
    const mat1 = Matrix3x3.identity;
    const mat2 = Matrix3x3.identity;
    const mat3 = Matrix3x3.identity;

    mat1.rotateAnglePost(1);
    mat2.rotateAnglePre(1);
    mat3.rotateAngleSet(1);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x3 - scale", () => {
    const mat1 = Matrix3x3.identity;
    const mat2 = Matrix3x3.identity;
    const mat3 = Matrix3x3.identity;

    mat1.scalePost(1, 2);
    mat2.scalePre(1, 2);
    mat3.scaleSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3x3 - translate", () => {
    const mat1 = Matrix3x3.identity;
    const mat2 = Matrix3x3.identity;
    const mat3 = Matrix3x3.identity;

    mat1.translatePost(1, 2);
    mat2.translatePre(1, 2);
    mat3.translateSet(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4x4 - mapPoint", () => {
    const mat = Matrix4x4.identity;
    const p = new Point3(1, 2, 3);

    const mapPoint = mat.mapPoint(p);

    expect(mapPoint).toEqual(p);
});

test("Matrix4x4 - mapVector", () => {
    const mat = Matrix4x4.identity;
    const v = new Vector3(1, 2, 3);

    const mapVector = mat.mapVector(v);

    expect(mapVector).toEqual(v);
});

test("Matrix4x4 - rotateX", () => {
    const mat1 = Matrix4x4.identity;
    const mat2 = Matrix4x4.identity;
    const mat3 = Matrix4x4.identity;

    mat1.rotateXAnglePost(1);
    mat2.rotateXAnglePre(1);
    mat3.rotateXAngleSet(1);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4x4 - rotateY", () => {
    const mat1 = Matrix4x4.identity;
    const mat2 = Matrix4x4.identity;
    const mat3 = Matrix4x4.identity;

    mat1.rotateYAnglePost(1);
    mat2.rotateYAnglePre(1);
    mat3.rotateYAngleSet(1);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4x4 - rotateZ", () => {
    const mat1 = Matrix4x4.identity;
    const mat2 = Matrix4x4.identity;
    const mat3 = Matrix4x4.identity;

    mat1.rotateZAnglePost(1);
    mat2.rotateZAnglePre(1);
    mat3.rotateZAngleSet(1);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4x4 - scale", () => {
    const mat1 = Matrix4x4.identity;
    const mat2 = Matrix4x4.identity;
    const mat3 = Matrix4x4.identity;

    mat1.scalePost(1, 2, 3);
    mat2.scalePre(1, 2, 3);
    mat3.scaleSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4x4 - translate", () => {
    const mat1 = Matrix4x4.identity;
    const mat2 = Matrix4x4.identity;
    const mat3 = Matrix4x4.identity;

    mat1.translatePost(1, 2, 3);
    mat2.translatePre(1, 2, 3);
    mat3.translateSet(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});
