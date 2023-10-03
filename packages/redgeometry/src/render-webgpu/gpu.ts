import type { World } from "../ecs/world.js";
import { assert } from "../utility/debug.js";

export interface GPUInitData {
    dataId: "gpuInit";
    alphaMode: GPUCanvasAlphaMode;
    context: GPUCanvasContext;
    deviceDescriptor: GPUDeviceDescriptor | undefined;
    gpu: GPU | undefined;
    requestAdapterOptions: GPURequestAdapterOptions | undefined;
}

export interface GPUData {
    dataId: "gpu";
    adapter: GPUAdapter;
    context: GPUCanvasContext;
    device: GPUDevice;
    gpu: GPU;
}

export function gpuPlugin(world: World): void {
    world.registerData<GPUInitData>("gpuInit");
    world.registerData<GPUData>("gpu");

    world.addSystem({ fn: startGPUSystem, stage: "start", mode: "async" });

    world.addDependency({ seq: [startGPUSystem], stage: "start" });
}

export async function startGPUSystem(world: World): Promise<void> {
    const { gpu, requestAdapterOptions, deviceDescriptor, context } = world.readData<GPUInitData>("gpuInit");
    assert(gpu !== undefined, "No GPU found");

    const adapter = await gpu.requestAdapter(requestAdapterOptions);
    assert(adapter !== null, "Unable to request GPU adapter");

    const device = await adapter.requestDevice(deviceDescriptor);
    world.writeData<GPUData>({ dataId: "gpu", gpu, adapter, device, context });
}
