import { ChangeFlags, EntityId, hasChangeFlag, hasComponent, World } from "../ecs";
import { Matrix4x4 } from "../primitives";
import { Float32Buffer, gpuCreateBuffer, NumberBuffer } from "./buffer";
import meshRenderCode from "./shader/mesh.wgsl";
import { TransformComponent } from "./transform";

export interface MeshComponent {
    componentId: "mesh";
    material: MeshMaterial;
    vertices: Float32Buffer | NumberBuffer;
}

export type MeshMaterial = {
    color: GPUColorDict;
    topology: GPUPrimitiveTopology;
};

type GPUPipelineContext = {
    vertexState: GPUVertexState;
    fragmentState?: GPUFragmentState;
    bindGroupLayouts: GPUBindGroupLayout[];
    pipelineLayout: GPUPipelineLayout;
};

type MeshRenderEntry = {
    bindGroup1: GPUBindGroup;
    colorBuffer: GPUBuffer;
    component: MeshComponent;
    pipeline: GPURenderPipeline;
    vertexBuffer: GPUBuffer;
    vertexCount: number;
};

export interface GPUData {
    dataId: "gpuData";
    format: GPUTextureFormat;
    device: GPUDevice;
    currentTextureView: GPUTextureView;
    mvpMatrix: Matrix4x4;
    canvas: HTMLCanvasElement;
}

interface MeshRenderStateData {
    dataId: "meshRenderStateData";
    entries: Map<EntityId, MeshRenderEntry>;
    pipeline: GPURenderPipeline;
    pipelineContext: GPUPipelineContext;
    depthTexture: GPUTexture;
}

export function meshRenderPlugin(world: World): void {
    world.registerData<GPUData>("gpuData");
    world.registerData<MeshRenderStateData>("meshRenderStateData");
    world.addSystem({ fn: initializeMeshRenderSystem, startup: true });
    world.addSystem({ fn: meshRenderSystem });
}

export function initializeMeshRenderSystem(world: World): void {
    const { canvas, device, format } = world.readData<GPUData>("gpuData");

    const entries = new Map();

    const pipelineContext = createPipelineContext(device, format);
    const pipeline = createRenderPipelineState(device, pipelineContext);

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    world.writeData<MeshRenderStateData>({
        dataId: "meshRenderStateData",
        entries,
        pipelineContext,
        pipeline,
        depthTexture,
    });
}

export function meshRenderSystem(world: World): void {
    const { device, currentTextureView, mvpMatrix } = world.readData<GPUData>("gpuData");
    const { entries, pipelineContext, pipeline, depthTexture } =
        world.readData<MeshRenderStateData>("meshRenderStateData");

    // Entries
    const query = world.queryEntitiesChanged<[MeshComponent]>(["mesh"]);

    for (const { entity, components, changeset } of query) {
        if (hasChangeFlag(changeset.mesh, ChangeFlags.Deleted)) {
            const entry = entries.get(entity);

            if (entry !== undefined) {
                destroyMeshEntry(entry);
                entries.delete(entity);
                // Debug.log("Mesh for entity '{}' deleted", entity);
            }
        }

        const transform = hasComponent<TransformComponent>(components, "transform")
            ? components.transform.local
            : Matrix4x4.identity;

        if (hasComponent<MeshComponent>(components, "mesh")) {
            if (hasChangeFlag(changeset.mesh, ChangeFlags.Created)) {
                const entry = createMeshEntry(device, pipelineContext, pipeline, components.mesh, transform);
                entries.set(entity, entry);
                // Debug.log("Mesh for entity '{}' created", entity);
            }
        }
    }

    // Render
    const colorAttachments: GPURenderPassColorAttachment[] = [
        {
            view: currentTextureView,
            clearValue: { r: 1, g: 1, b: 1, a: 1 },
            loadOp: "clear",
            storeOp: "store",
        },
    ];

    const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
        view: depthTexture.createView(),
        depthClearValue: 0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
    };

    const bindGroup0 = createBindGroup0(device, pipelineContext, mvpMatrix);

    const commandEncoder = device.createCommandEncoder();
    const renderPassEncoder = commandEncoder.beginRenderPass({ colorAttachments, depthStencilAttachment });

    renderPassEncoder.setBindGroup(0, bindGroup0);

    for (const entry of entries.values()) {
        renderPassEncoder.setPipeline(entry.pipeline);
        renderPassEncoder.setBindGroup(1, entry.bindGroup1);
        renderPassEncoder.setVertexBuffer(0, entry.vertexBuffer);
        renderPassEncoder.draw(entry.vertexCount, 1, 0, 0);
    }

    renderPassEncoder.end();

    const commandBuffer = commandEncoder.finish();

    device.queue.submit([commandBuffer]);
}

function createPipelineContext(device: GPUDevice, format: GPUTextureFormat): GPUPipelineContext {
    const shaderModule = device.createShaderModule({
        code: meshRenderCode,
    });

    const vertexState: GPUVertexState = {
        module: shaderModule,
        entryPoint: "vertex_main",
        buffers: [{ attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }], arrayStride: 12 }],
    };
    const fragmentState: GPUFragmentState = {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [{ format }],
    };

    const bindGroupLayoutDescriptors: GPUBindGroupLayoutDescriptor[] = [
        { entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }] },
        {
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
            ],
        },
    ];

    const bindGroupLayouts = bindGroupLayoutDescriptors.map((d) => device.createBindGroupLayout(d));
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts });

    return { vertexState, fragmentState, bindGroupLayouts, pipelineLayout };
}

function createBindGroup0(device: GPUDevice, pipelineContext: GPUPipelineContext, mat: Matrix4x4): GPUBindGroup {
    return device.createBindGroup({
        entries: [
            {
                binding: 0,
                resource: { buffer: createMatrixBuffer(device, mat) },
            },
        ],
        layout: pipelineContext.bindGroupLayouts[0],
    });
}

function createRenderPipelineState(device: GPUDevice, ctx: GPUPipelineContext): GPURenderPipeline {
    const renderPipelineDescriptor: GPURenderPipelineDescriptor = {
        vertex: ctx.vertexState,
        fragment: ctx.fragmentState,
        primitive: { topology: "triangle-list" },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: "greater",
            format: "depth24plus",
        },
        layout: ctx.pipelineLayout,
    };

    return device.createRenderPipeline(renderPipelineDescriptor);
}

function createColorBuffer(device: GPUDevice, color: GPUColorDict): GPUBuffer {
    const gpuBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM,
        mappedAtCreation: true,
    });

    const mappedRange = gpuBuffer.getMappedRange();
    const destData = new Float32Array(mappedRange);

    destData[0] = color.r;
    destData[1] = color.g;
    destData[2] = color.b;
    destData[3] = color.a;

    gpuBuffer.unmap();

    return gpuBuffer;
}

function createMatrixBuffer(device: GPUDevice, mat: Matrix4x4): GPUBuffer {
    const gpuBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM,
        mappedAtCreation: true,
    });

    const mappedRange = gpuBuffer.getMappedRange();
    const destData = new Float32Array(mappedRange);

    const srcData = mat.toArray(true);

    for (let i = 0; i < 16; i++) {
        destData[i] = srcData[i];
    }

    gpuBuffer.unmap();

    return gpuBuffer;
}

function createMeshEntry(
    device: GPUDevice,
    pipelineContext: GPUPipelineContext,
    pipeline: GPURenderPipeline,
    meshComp: MeshComponent,
    transform: Matrix4x4
): MeshRenderEntry {
    const { material, vertices } = meshComp;
    const vertexCount = vertices.array.length / 3;
    const vertexBuffer = gpuCreateBuffer(device, vertices, GPUBufferUsage.VERTEX);
    const colorBuffer = createColorBuffer(device, material.color);
    const transformBuffer = createMatrixBuffer(device, transform);

    const bindGroup1 = device.createBindGroup({
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: transformBuffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: colorBuffer,
                },
            },
        ],
        layout: pipelineContext.bindGroupLayouts[1],
    });

    return {
        component: meshComp,
        colorBuffer,
        vertexBuffer,
        vertexCount,
        pipeline,
        bindGroup1,
    };
}

function destroyMeshEntry(entry: MeshRenderEntry): void {
    entry.vertexBuffer.destroy();
    entry.colorBuffer.destroy();
}
