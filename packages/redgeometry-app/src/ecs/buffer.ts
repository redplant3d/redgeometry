import type { NumberBuffer, TypedBuffer } from "redgeometry/src/utility/buffer";

export function gpuCreateBuffer(
    device: GPUDevice,
    data: NumberBuffer | TypedBuffer,
    flags: GPUBufferUsageFlags,
): GPUBuffer {
    // See: https://toji.github.io/webgpu-best-practices/buffer-uploads.html
    if (data.type === "number") {
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
