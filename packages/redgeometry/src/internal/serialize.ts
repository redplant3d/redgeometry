import { Matrix3x2, Matrix3x3, Matrix4x4, Point2, Point3, Vector2, Vector3 } from "../primitives";

export function deserializePrimitiveObject(json: string): unknown {
    return JSON.parse(json, (_, obj) => {
        const type = obj["type"];
        const data = obj["data"];

        // Check if object needs to be revived
        if (type === undefined || data === undefined) return obj;

        // Internal primitives
        if (type === "Int8Array") return new Int8Array(data);
        if (type === "Int16Array") return new Int16Array(data);
        if (type === "Int32Array") return new Int32Array(data);
        if (type === "Uint8Array") return new Uint8Array(data);
        if (type === "Uint8ClampedArray") return new Uint8ClampedArray(data);
        if (type === "Uint16Array") return new Uint16Array(data);
        if (type === "Uint32Array") return new Uint32Array(data);
        if (type === "Float32Array") return new Float32Array(data);
        if (type === "Float64Array") return new Float64Array(data);
        if (type === "Set") return new Set(data);
        if (type === "Map") return new Map(data);

        // Custom primitives
        if (type === "Point2") return Point2.fromArray(data as number[]);
        if (type === "Vector2") return Vector2.fromArray(data as number[]);
        if (type === "Point3") return Point3.fromArray(data as number[]);
        if (type === "Vector3") return Vector3.fromArray(data as number[]);
        if (type === "Matrix3x2") return Matrix3x2.fromArray(data as number[]);
        if (type === "Matrix3x3") return Matrix3x3.fromArray(data as number[]);
        if (type === "Matrix4x4") return Matrix4x4.fromArray(data as number[]);

        return obj;
    });
}

export function serializePrimitiveObject(data: unknown): string {
    return JSON.stringify(data, (_, obj) => {
        // Check if object needs to be replaced
        if (typeof obj !== "object") return obj;

        // Internal primitives
        if (obj instanceof Int8Array) return { type: "Int8Array", data: [...obj] };
        if (obj instanceof Int16Array) return { type: "Int16Array", data: [...obj] };
        if (obj instanceof Int32Array) return { type: "Int32Array", data: [...obj] };
        if (obj instanceof Uint8Array) return { type: "Uint8Array", data: [...obj] };
        if (obj instanceof Uint8ClampedArray) return { type: "Uint8ClampedArray", data: [...obj] };
        if (obj instanceof Uint16Array) return { type: "Uint16Array", data: [...obj] };
        if (obj instanceof Uint32Array) return { type: "Uint32Array", data: [...obj] };
        if (obj instanceof Float32Array) return { type: "Float32Array", data: [...obj] };
        if (obj instanceof Float64Array) return { type: "Float64Array", data: [...obj] };
        if (obj instanceof Set) return { type: "Set", data: [...obj] };
        if (obj instanceof Map) return { type: "Map", data: [...obj] };

        // Custom primitives
        if (obj instanceof Point2) return { type: "Point2", data: obj.toArray() };
        if (obj instanceof Vector2) return { type: "Vector2", data: obj.toArray() };
        if (obj instanceof Point3) return { type: "Point3", data: obj.toArray() };
        if (obj instanceof Vector3) return { type: "Vector3", data: obj.toArray() };
        if (obj instanceof Matrix3x2) return { type: "Matrix3x2", data: obj.toArray() };
        if (obj instanceof Matrix3x3) return { type: "Matrix3x3", data: obj.toArray() };
        if (obj instanceof Matrix4x4) return { type: "Matrix4x4", data: obj.toArray() };

        return obj;
    });
}
