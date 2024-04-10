import type { FixedSizeArrayBuilder } from "../internal/types.js";

export type Constructor<T> = {
    new (...args: never[]): T;
};

export type FixedSizeArray<T, N extends number> = FixedSizeArrayBuilder<T, N, []>;

export type Immutable<T> = {
    readonly [K in keyof T]: Immutable<T[K]>;
};

export type KeyValue<K, V> = {
    key: K;
    value: V;
};

export type Nominal<T, U> = T & {
    readonly __brand: U;
};

export type ValueRef<T> = {
    value: T;
};
