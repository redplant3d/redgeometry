import { log } from "../utility/debug.js";
import type { Constructor } from "../utility/types.js";

export type SerializationMapping<T = unknown, U = unknown> = {
    classType: Constructor<T>;
    serialize(obj: T): U;
    deserialize(data: U): T;
};

export const DEFAULT_SERIALIZATION_MAPPING: ReadonlyArray<SerializationMapping> = [
    {
        classType: Int8Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Int8Array(data),
    } satisfies SerializationMapping<Int8Array, number[]>,
    {
        classType: Int16Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Int16Array(data),
    } satisfies SerializationMapping<Int16Array, number[]>,
    {
        classType: Int32Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Int32Array(data),
    } satisfies SerializationMapping<Int32Array, number[]>,
    {
        classType: Uint8Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Uint8Array(data),
    } satisfies SerializationMapping<Uint8Array, number[]>,
    {
        classType: Uint8ClampedArray,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Uint8ClampedArray(data),
    } satisfies SerializationMapping<Uint8ClampedArray, number[]>,
    {
        classType: Uint16Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Uint16Array(data),
    } satisfies SerializationMapping<Uint16Array, number[]>,
    {
        classType: Uint32Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Uint32Array(data),
    } satisfies SerializationMapping<Uint32Array, number[]>,
    {
        classType: Float32Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Float32Array(data),
    } satisfies SerializationMapping<Float32Array, number[]>,
    {
        classType: Float64Array,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Float64Array(data),
    } satisfies SerializationMapping<Float64Array, number[]>,
    {
        classType: Set,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Set(data),
    } satisfies SerializationMapping<Set<unknown>, unknown[]>,
    {
        classType: Map,
        serialize: (obj) => [...obj],
        deserialize: (data) => new Map(data),
    } satisfies SerializationMapping<Map<unknown, unknown>, [unknown, unknown][]>,
];

export class SerializationMap {
    public mappings: SerializationMapping[];

    public constructor(initialMappings?: SerializationMapping[]) {
        this.mappings = initialMappings ?? [];
    }

    public add<T, U>(classType: Constructor<T>, serialize: (obj: T) => U, deserialize: (data: U) => T): void {
        this.mappings.push({ classType, serialize, deserialize });
    }

    public clear(): void {
        this.mappings = [];
    }

    public deserialize(json: string): unknown {
        return JSON.parse(json, (_, obj) => {
            const type = obj["type"];
            const data = obj["data"];

            // Check if object needs to be revived
            if (type === undefined || data === undefined) {
                return obj;
            }

            for (const mapping of this.mappings) {
                if (mapping.classType.name === type) {
                    return mapping.deserialize(data);
                }
            }

            log.warn("Unable to deserialize type '{}'", type);

            return obj;
        });
    }

    public serialize(data: unknown): string {
        return JSON.stringify(data, (_, obj) => {
            const ctor = obj.constructor;

            // Check for primitive types
            if (ctor === Boolean || ctor === Number || ctor === String || ctor === Object || ctor === Array) {
                return obj;
            }

            for (const mapping of this.mappings) {
                if (mapping.classType === ctor) {
                    return { type: mapping.classType.name, data: mapping.serialize(obj) };
                }
            }

            log.warn("Unable to serialize type '{}'", ctor.name);

            return obj;
        });
    }
}
