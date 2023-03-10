export type Constructor<T> = {
    new (...args: any[]): T;
};

export type Immutable<T> = {
    readonly [K in keyof T]: Immutable<T[K]>;
};

export type KeyValue<K, V> = {
    key: K;
    value: V;
};

export type ValueRef<T> = {
    value: T;
};
