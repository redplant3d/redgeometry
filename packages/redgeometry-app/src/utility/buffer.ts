export type Float32Buffer = { type: "float32"; array: Float32Array };
export type Float64Buffer = { type: "float64"; array: Float64Array };
export type Int8Buffer = { type: "int8"; array: Int8Array };
export type Int16Buffer = { type: "int16"; array: Int16Array };
export type Int32Buffer = { type: "int32"; array: Int32Array };
export type Uint8Buffer = { type: "uint8"; array: Uint8Array };
export type Uint8ClampedBuffer = { type: "uint8-clamped"; array: Uint8ClampedArray };
export type Uint16Buffer = { type: "uint16"; array: Uint16Array };
export type Uint32Buffer = { type: "uint32"; array: Uint32Array };
export type NumberBuffer = { type: "number"; array: number[] };

export type TypedBuffer =
    | Float32Buffer
    | Float64Buffer
    | Int8Buffer
    | Int16Buffer
    | Int32Buffer
    | Uint8Buffer
    | Uint8ClampedBuffer
    | Uint16Buffer
    | Uint32Buffer;
