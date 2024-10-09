import { assertUnreachable, throwError } from "../utility/debug.js";
import type { Constructor } from "../utility/types.js";

export type ClassObjectMapping<T> = {
    type: "Class";
    clsId: string;
    clsCtor: Constructor<T>;
};

export type PrimitiveCollectionObjectMapping<T, U> = {
    type: "PrimitiveCollection";
    clsCtor: Constructor<T>;
    clsId: string;
    map(obj: T): U;
    unmap(data: U): T;
};

export type RecursiveCollectionObjectMapping<T, U> = {
    type: "RecursiveCollection";
    clsCtor: Constructor<T>;
    clsId: string;
    map(obj: T): U;
    unmap(data: U): T;
};

export type ObjectMapping<T = unknown, U = unknown> =
    | ClassObjectMapping<T>
    | PrimitiveCollectionObjectMapping<T, U>
    | RecursiveCollectionObjectMapping<T, U>;

export const DEFAULT_BUILTIN_OBJECT_MAPPING: ReadonlyArray<ObjectMapping> = [
    {
        type: "PrimitiveCollection",
        clsCtor: Int8Array,
        clsId: "Int8Array",
        map: (obj) => [...obj],
        unmap: (data) => new Int8Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Int8Array, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Int16Array,
        clsId: "Int16Array",
        map: (obj) => [...obj],
        unmap: (data) => new Int16Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Int16Array, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Int32Array,
        clsId: "Int32Array",
        map: (obj) => [...obj],
        unmap: (data) => new Int32Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Int32Array, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Uint8Array,
        clsId: "Uint8Array",
        map: (obj) => [...obj],
        unmap: (data) => new Uint8Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Uint8Array, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Uint8ClampedArray,
        clsId: "Uint8ClampedArray",
        map: (obj) => [...obj],
        unmap: (data) => new Uint8ClampedArray(data),
    } satisfies PrimitiveCollectionObjectMapping<Uint8ClampedArray, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Uint16Array,
        clsId: "Uint16Array",
        map: (obj) => [...obj],
        unmap: (data) => new Uint16Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Uint16Array, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Uint32Array,
        clsId: "Uint32Array",
        map: (obj) => [...obj],
        unmap: (data) => new Uint32Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Uint32Array, number[]>,
    {
        clsId: "Float32Array",
        clsCtor: Float32Array,
        type: "PrimitiveCollection",
        map: (obj) => [...obj],
        unmap: (data) => new Float32Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Float32Array, number[]>,
    {
        type: "PrimitiveCollection",
        clsCtor: Float64Array,
        clsId: "Float64Array",
        map: (obj) => [...obj],
        unmap: (data) => new Float64Array(data),
    } satisfies PrimitiveCollectionObjectMapping<Float64Array, number[]>,
    {
        type: "RecursiveCollection",
        clsCtor: Set,
        clsId: "Set",
        map: (obj) => [...obj],
        unmap: (data) => new Set(data),
    } satisfies RecursiveCollectionObjectMapping<Set<unknown>, unknown[]>,
    {
        type: "RecursiveCollection",
        clsCtor: Map,
        clsId: "Map",
        map: (obj) => [...obj],
        unmap: (data) => new Map(data),
    } satisfies RecursiveCollectionObjectMapping<Map<unknown, unknown>, [unknown, unknown][]>,
];

export class ObjectMapper {
    private mappingsBuiltin: ObjectMapping[];
    private mappingsCustom: ObjectMapping[];

    public constructor() {
        this.mappingsBuiltin = [...DEFAULT_BUILTIN_OBJECT_MAPPING];
        this.mappingsCustom = [];
    }

    public addClassMapping<T>(ctor: Constructor<T>, id: string): void {
        this.mappingsCustom.push({ type: "Class", clsCtor: ctor, clsId: id });
    }

    public addMapping<T, U>(mapping: ObjectMapping<T, U>): void {
        this.mappingsCustom.push(mapping);
    }

    public clearMapping(): void {
        this.mappingsCustom = [];
    }

    public fromObject(obj: unknown): unknown {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }

        const clsCtor = obj.constructor as Constructor<unknown>;

        if (clsCtor === Array) {
            return this.iterateFromArray(obj as unknown[]);
        }

        const clsId = "__clsId" in obj ? obj.__clsId : undefined;
        const clsData = "__clsData" in obj ? obj.__clsData : undefined;

        if (clsId === undefined || clsData === undefined) {
            return this.iterateFromObject(obj);
        }

        for (const mapping of this.mappingsBuiltin) {
            if (mapping.clsId !== clsId) {
                continue;
            }

            return this.iterateFromMapping(clsData, mapping);
        }

        for (const mapping of this.mappingsCustom) {
            if (mapping.clsId !== clsId) {
                continue;
            }

            return this.iterateFromMapping(clsData, mapping);
        }

        throwError("Unknown class '{}'", clsCtor.name);
    }

    public toObject(obj: unknown): unknown {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }

        const clsCtor = obj.constructor as Constructor<unknown>;

        if (clsCtor === Object) {
            return this.iterateToObject(obj);
        }

        if (clsCtor === Array) {
            return this.iterateToArray(obj as unknown[]);
        }

        for (const mapping of this.mappingsBuiltin) {
            if (mapping.clsCtor !== clsCtor) {
                continue;
            }

            return {
                __clsId: mapping.clsId,
                __clsData: this.iterateToMapping(obj, mapping),
            };
        }

        for (const mapping of this.mappingsCustom) {
            if (mapping.clsCtor !== clsCtor) {
                continue;
            }

            return {
                __clsId: mapping.clsId,
                __clsData: this.iterateToMapping(obj, mapping),
            };
        }

        throwError("Unknown class '{}'", clsCtor.name);
    }

    private iterateFromArray(array: unknown[]): unknown[] {
        const nextArray: unknown[] = [];

        for (const [key, value] of array.entries()) {
            nextArray[key] = this.fromObject(value);
        }

        return nextArray;
    }

    private iterateFromMapping(obj: unknown, mapping: ObjectMapping<unknown, unknown>): unknown {
        switch (mapping.type) {
            case "Class": {
                const properties = Object.getOwnPropertyDescriptors(obj);
                return Object.create(mapping.clsCtor.prototype, properties);
            }
            case "PrimitiveCollection": {
                return mapping.unmap(obj);
            }
            case "RecursiveCollection": {
                const nextObj = this.fromObject(obj);
                return mapping.unmap(nextObj);
            }
            default: {
                assertUnreachable(mapping);
            }
        }
    }

    private iterateFromObject(obj: object): unknown {
        const nextObj: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
            nextObj[key] = this.fromObject(value);
        }

        return nextObj;
    }

    private iterateToArray(array: unknown[]): unknown[] {
        const nextArray: unknown[] = [];

        for (const [key, value] of array.entries()) {
            nextArray[key] = this.toObject(value);
        }

        return nextArray;
    }

    private iterateToMapping(obj: object, mapping: ObjectMapping<unknown, unknown>): unknown {
        switch (mapping.type) {
            case "Class": {
                return this.toObject({ ...obj });
            }
            case "PrimitiveCollection": {
                return mapping.map(obj);
            }
            case "RecursiveCollection": {
                const nextObj = mapping.map(obj);
                return this.toObject(nextObj);
            }
            default: {
                assertUnreachable(mapping);
            }
        }
    }

    private iterateToObject(obj: object): unknown {
        const nextObj: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
            nextObj[key] = this.toObject(value);
        }

        return nextObj;
    }
}
