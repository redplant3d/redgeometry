export type Float32Buffer = { type: "Float32"; array: Float32Array };
export type Float64Buffer = { type: "Float64"; array: Float64Array };
export type Int8Buffer = { type: "Int8"; array: Int8Array };
export type Int16Buffer = { type: "Int16"; array: Int16Array };
export type Int32Buffer = { type: "Int32"; array: Int32Array };
export type Uint8Buffer = { type: "Uint8"; array: Uint8Array };
export type Uint8ClampedBuffer = { type: "Uint8Clamped"; array: Uint8ClampedArray };
export type Uint16Buffer = { type: "Uint16"; array: Uint16Array };
export type Uint32Buffer = { type: "Uint32"; array: Uint32Array };
export type NumberBuffer = { type: "Number"; array: number[] };

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

export function gpuCreateBuffer(
    device: GPUDevice,
    data: NumberBuffer | TypedBuffer,
    flags: GPUBufferUsageFlags,
): GPUBuffer {
    // See: https://toji.github.io/webgpu-best-practices/buffer-uploads.html
    if (data.type === "Number") {
        const srcData = data.array;
        const gpuBuffer = device.createBuffer({
            size: 4 * srcData.length,
            usage: flags,
            mappedAtCreation: true,
        });

        const mappedRange = gpuBuffer.getMappedRange();
        const destData = new Float32Array(mappedRange);

        for (let i = 0; i < destData.length; i++) {
            destData[i] = srcData[i];
        }

        gpuBuffer.unmap();

        return gpuBuffer;
    } else {
        const srcData = data.array;
        const gpuBuffer = device.createBuffer({
            size: srcData.BYTES_PER_ELEMENT * srcData.length,
            usage: flags | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(gpuBuffer, 0, srcData.buffer);

        return gpuBuffer;
    }
}
