import type { WorldModule } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import { assert } from "redgeometry/src/utility/debug";

export type GPUInitData = {
    dataId: "gpu-init";
    alphaMode: GPUCanvasAlphaMode;
    context: GPUCanvasContext;
    deviceDescriptor: GPUDeviceDescriptor | undefined;
    gpu: GPU | undefined;
    requestAdapterOptions: GPURequestAdapterOptions | undefined;
};

export type GPUData = {
    dataId: "gpu";
    adapter: GPUAdapter;
    context: GPUCanvasContext;
    device: GPUDevice;
    gpu: GPU;
};

export class GPUModule implements WorldModule {
    public readonly moduleId = "gpu";

    public setup(world: World): void {
        world.registerData<GPUInitData>("gpu-init");
        world.registerData<GPUData>("gpu");

        world.addSystem({ stage: "start-post", fn: startGPUSystem, awaitMode: "dependency" });
    }
}

export async function startGPUSystem(world: World): Promise<void> {
    const { gpu, requestAdapterOptions, deviceDescriptor, context } = world.readData<GPUInitData>("gpu-init");
    assert(gpu !== undefined, "No GPU found");

    const adapter = await gpu.requestAdapter(requestAdapterOptions);
    assert(adapter !== null, "Unable to request GPU adapter");

    const device = await adapter.requestDevice(deviceDescriptor);
    world.writeData<GPUData>({ dataId: "gpu", gpu, adapter, device, context });
}
