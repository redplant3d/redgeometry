import type { WorldPlugin, WorldPluginId } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import { assert } from "redgeometry/src/utility/debug";

export type GPUInitData = {
    dataId: "gpuInit";
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

export class GPUPlugin implements WorldPlugin {
    public get id(): WorldPluginId {
        return "gpu";
    }

    public setup(world: World): void {
        world.registerData<GPUInitData>("gpuInit");
        world.registerData<GPUData>("gpu");

        world.addSystem({ stage: "start-post", fn: startGPUSystem, awaitMode: "dependency" });
    }
}

export async function startGPUSystem(world: World): Promise<void> {
    const { gpu, requestAdapterOptions, deviceDescriptor, context } = world.readData<GPUInitData>("gpuInit");
    assert(gpu !== undefined, "No GPU found");

    const adapter = await gpu.requestAdapter(requestAdapterOptions);
    assert(adapter !== null, "Unable to request GPU adapter");

    const device = await adapter.requestDevice(deviceDescriptor);
    world.writeData<GPUData>({ dataId: "gpu", gpu, adapter, device, context });
}
