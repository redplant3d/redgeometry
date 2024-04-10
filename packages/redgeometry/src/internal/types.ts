export type FixedSizeArrayBuilder<T, N extends number, A extends T[]> = A["length"] extends N
    ? A
    : FixedSizeArrayBuilder<T, N, [...A, T]>;
