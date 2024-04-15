import type { Matrix4 } from "redgeometry/src/primitives/matrix";
import { type Float32Buffer, type NumberBuffer } from "redgeometry/src/utility/buffer";
import { assertDebug, log } from "redgeometry/src/utility/debug";
import type { ComponentIdsOf, DefaultSystemStage, EntityId, WorldModule } from "../ecs/types.js";
import type { World } from "../ecs/world.js";
import { gpuCreateBuffer } from "../utility/gpu.js";
import { AssetModule, AssetPlugin, type AssetId } from "./asset.js";
import { cameraSystem, type CameraComponent } from "./camera.js";
import { startGPUSystem, type GPUData } from "./gpu.js";
import type { Material, MaterialComponent } from "./material.js";
import type { SceneData } from "./scene.js";
import MESH_WGSL from "./shader/mesh.wgsl";
import { transformSystem, type ComputedTransformComponent, type TransformComponent } from "./transform.js";

export type MeshBundle = [MeshComponent, MaterialComponent, TransformComponent];
export const MESH_BUNDLE_IDS = ["mesh", "material", "transform"] satisfies ComponentIdsOf<MeshBundle>;

const MESH_MAX_ENTRIES_PER_MATERIAL = 50000;

export type Mesh = {
    vertices: Float32Buffer | NumberBuffer;
};

export interface MeshComponent {
    componentId: "mesh";
    handle: AssetId<Mesh>;
}

type GPUPipelineContext = {
    vertexState: GPUVertexState;
    fragmentState?: GPUFragmentState;
    bindGroupLayouts: GPUBindGroupLayout[];
    pipelineLayout: GPUPipelineLayout;
};

type MaterialEntry = {
    bindGroup1: GPUBindGroup;
    colorBuffer: GPUBuffer;
    meshEntries: Map<AssetId<Mesh>, MeshEntry>;
};

type MeshEntry = {
    instances: EntityId[];
    transformsBufferStaging: Float32Buffer;
    transformsBuffer: GPUBuffer;
    positionsBuffer: GPUBuffer;
    positionsCount: number;
    needsUpdate: boolean;
};

type MeshRenderEntry = {
    entity: EntityId;
    instanceIdx: number;
    materialId: AssetId<Material>;
    meshId: AssetId<Mesh>;
};

export type MeshRenderStateData = {
    dataId: "mesh-render-state";
    depthTexture: GPUTexture;
    entries: Map<EntityId, MeshRenderEntry>;
    materialEntries: Map<AssetId<Material>, MaterialEntry>;
    pipeline: GPURenderPipeline;
    pipelineContext: GPUPipelineContext;
};

export class MeshRenderModule implements WorldModule {
    public readonly moduleId = "mesh-render";

    public setup(world: World): void {
        world.addModules([new AssetModule()]);

        world.registerData<MeshRenderStateData>("mesh-render-state");
        world.registerData<SceneData>("scene");

        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: startMeshRenderSystem });

        world.addSystem<DefaultSystemStage>({ stage: "update-post", fn: transformSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-post", fn: cameraSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-post", fn: meshRenderSystem });

        world.addDependency<DefaultSystemStage>({
            stage: "start-post",
            seq: [startGPUSystem, startMeshRenderSystem],
        });

        world.addDependency<DefaultSystemStage>({
            stage: "update-post",
            seq: [transformSystem, cameraSystem, meshRenderSystem],
        });
    }
}

export function startMeshRenderSystem(world: World): void {
    const { context, device, gpu } = world.readData<GPUData>("gpu");
    const { canvas } = context;

    const entries = new Map();
    const materialEntries = new Map();

    const format = gpu.getPreferredCanvasFormat();
    const pipelineContext = createPipelineContext(device, format);
    const pipeline = createRenderPipelineState(device, pipelineContext);

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    world.writeData<MeshRenderStateData>({
        dataId: "mesh-render-state",
        depthTexture,
        entries,
        materialEntries,
        pipeline,
        pipelineContext,
    });
}

export function meshRenderSystem(world: World): void {
    const gpuData = world.readData<GPUData>("gpu");
    const stateData = world.readData<MeshRenderStateData>("mesh-render-state");

    const asset = world.getPlugin<AssetPlugin>("asset");

    // Entries
    for (const entity of world.getEntitiesChanged()) {
        const mesh = world.getComponent<MeshComponent>(entity, "mesh");
        const material = world.getComponent<MaterialComponent>(entity, "material");
        const computedTransform = world.getComponent<ComputedTransformComponent>(entity, "computed-transform");

        let entry = stateData.entries.get(entity);

        if (mesh !== undefined && material !== undefined && computedTransform !== undefined) {
            if (entry === undefined) {
                entry = createMeshEntry(gpuData.device, stateData, asset, entity, mesh, material);
            }

            updateMeshEntry(stateData, entry, computedTransform);
        } else {
            if (entry !== undefined) {
                destroyMeshEntry(stateData, entry);
            }
        }
    }

    // Render
    const currentTextureView = gpuData.context.getCurrentTexture();
    const colorAttachments: GPURenderPassColorAttachment[] = [
        {
            view: currentTextureView.createView(),
            clearValue: { r: 1, g: 1, b: 1, a: 1 },
            loadOp: "clear",
            storeOp: "store",
        },
    ];

    const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
        view: stateData.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
    };

    const sceneData = world.readData<SceneData>("scene");
    const camera = world.getComponent<CameraComponent>(sceneData.mainCamera, "camera");

    if (camera === undefined) {
        log.warn("No camera found");
        return;
    }

    const bindGroup0 = createBindGroup0(gpuData.device, stateData.pipelineContext, camera.viewProjection);

    const commandEncoder = gpuData.device.createCommandEncoder();
    const renderPassEncoder = commandEncoder.beginRenderPass({ colorAttachments, depthStencilAttachment });

    // Shader variant
    renderPassEncoder.setPipeline(stateData.pipeline);

    // Camera uniforms
    renderPassEncoder.setBindGroup(0, bindGroup0);

    for (const materialEntry of stateData.materialEntries.values()) {
        // Material uniforms
        renderPassEncoder.setBindGroup(1, materialEntry.bindGroup1);

        for (const meshEntry of materialEntry.meshEntries.values()) {
            if (meshEntry.needsUpdate) {
                gpuData.device.queue.writeBuffer(
                    meshEntry.transformsBuffer,
                    0,
                    meshEntry.transformsBufferStaging.array,
                    0,
                    meshEntry.instances.length * 12,
                );
                meshEntry.needsUpdate = false;
            }

            // Mesh vertices
            renderPassEncoder.setVertexBuffer(0, meshEntry.positionsBuffer);

            // Mesh transforms
            renderPassEncoder.setVertexBuffer(1, meshEntry.transformsBuffer);

            // Draw call
            renderPassEncoder.draw(meshEntry.positionsCount, meshEntry.instances.length, 0, 0);
        }
    }

    renderPassEncoder.end();

    const commandBuffer = commandEncoder.finish();

    gpuData.device.queue.submit([commandBuffer]);
}

function createPipelineContext(device: GPUDevice, format: GPUTextureFormat): GPUPipelineContext {
    const shaderModule = device.createShaderModule({
        code: MESH_WGSL,
    });

    const vertexState: GPUVertexState = {
        module: shaderModule,
        entryPoint: "vertex_main",
        buffers: [
            {
                attributes: [
                    // Model vertex positions
                    { shaderLocation: 0, offset: 0, format: "float32x3" },
                ],
                arrayStride: 12,
                stepMode: "vertex",
            },
            {
                attributes: [
                    // Model transform matrix columns
                    { shaderLocation: 1, offset: 0, format: "float32x3" },
                    { shaderLocation: 2, offset: 12, format: "float32x3" },
                    { shaderLocation: 3, offset: 24, format: "float32x3" },
                    { shaderLocation: 4, offset: 36, format: "float32x3" },
                ],
                arrayStride: 48,
                stepMode: "instance",
            },
        ],
    };
    const fragmentState: GPUFragmentState = {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [{ format }],
    };

    const bindGroupLayoutDescriptors: GPUBindGroupLayoutDescriptor[] = [
        {
            // View and projection transform matrix
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }],
        },
        {
            // Color
            entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
        },
    ];

    const bindGroupLayouts = bindGroupLayoutDescriptors.map((d) => device.createBindGroupLayout(d));
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts });

    return { vertexState, fragmentState, bindGroupLayouts, pipelineLayout };
}

function createBindGroup0(device: GPUDevice, pipelineContext: GPUPipelineContext, mat: Matrix4): GPUBindGroup {
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
            depthCompare: "less",
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

function createMatrixBuffer(device: GPUDevice, mat: Matrix4): GPUBuffer {
    const gpuBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM,
        mappedAtCreation: true,
    });

    const mappedRange = gpuBuffer.getMappedRange();
    const destData = new Float32Array(mappedRange);

    destData.set(mat.elements);

    gpuBuffer.unmap();

    return gpuBuffer;
}

function createMeshEntry(
    device: GPUDevice,
    stateData: MeshRenderStateData,
    assetPlugin: AssetPlugin,
    entity: EntityId,
    meshComp: MeshComponent,
    materialComp: MaterialComponent,
): MeshRenderEntry {
    let materialEntry = stateData.materialEntries.get(materialComp.handle);

    if (materialEntry === undefined) {
        // Create material entry if missing
        const material = assetPlugin.materials.entries.get(materialComp.handle);
        assertDebug(material !== undefined);

        const colorBuffer = createColorBuffer(device, material.color);
        const bindGroup1 = device.createBindGroup({
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: colorBuffer,
                    },
                },
            ],
            layout: stateData.pipelineContext.bindGroupLayouts[1],
        });

        materialEntry = {
            bindGroup1,
            colorBuffer,
            meshEntries: new Map(),
        };

        stateData.materialEntries.set(materialComp.handle, materialEntry);
    }

    let meshEntry = materialEntry.meshEntries.get(meshComp.handle);

    if (meshEntry === undefined) {
        // Create mesh entry if missing
        const mesh = assetPlugin.meshes.entries.get(meshComp.handle);
        assertDebug(mesh !== undefined);

        const transformsData: Float32Buffer = {
            type: "float32",
            array: new Float32Array(12 * MESH_MAX_ENTRIES_PER_MATERIAL),
        };

        meshEntry = {
            instances: [],
            transformsBufferStaging: transformsData,
            transformsBuffer: gpuCreateBuffer(device, transformsData, GPUBufferUsage.VERTEX),
            positionsBuffer: gpuCreateBuffer(device, mesh.vertices, GPUBufferUsage.VERTEX),
            positionsCount: mesh.vertices.array.length / 3,
            needsUpdate: true,
        };

        materialEntry.meshEntries.set(meshComp.handle, meshEntry);
    }

    const instanceIdx = meshEntry.instances.length;

    meshEntry.instances.push(entity);

    const entry: MeshRenderEntry = {
        entity,
        instanceIdx,
        materialId: materialComp.handle,
        meshId: meshComp.handle,
    };

    stateData.entries.set(entity, entry);

    return entry;
}

function destroyMeshEntry(stateData: MeshRenderStateData, entry: MeshRenderEntry): void {
    const materialEntry = stateData.materialEntries.get(entry.materialId);
    assertDebug(materialEntry !== undefined);

    const meshEntry = materialEntry.meshEntries.get(entry.meshId);
    assertDebug(meshEntry !== undefined);

    const lastEntity = meshEntry.instances.pop();
    assertDebug(lastEntity !== undefined);

    const lastInstIdx = meshEntry.instances.length;
    const instIdx = entry.instanceIdx;

    if (instIdx < lastInstIdx) {
        // Move buffer
        const data = meshEntry.transformsBufferStaging.array;
        const srcIdx = 12 * lastInstIdx;
        const destIdx = 12 * instIdx;

        data.copyWithin(destIdx, srcIdx, 12);

        // Move instance
        meshEntry.instances[instIdx] = lastEntity;
    }
}

function updateMeshEntry(
    stateData: MeshRenderStateData,
    entry: MeshRenderEntry,
    computedTransform: ComputedTransformComponent,
): void {
    const materialEntry = stateData.materialEntries.get(entry.materialId);
    assertDebug(materialEntry !== undefined);

    const meshEntry = materialEntry.meshEntries.get(entry.meshId);
    assertDebug(meshEntry !== undefined);

    // Copy transform data
    const destData = meshEntry.transformsBufferStaging.array;
    const srcData = computedTransform.global.elements;
    const destIdx = 12 * entry.instanceIdx;

    destData.set(srcData, destIdx);

    meshEntry.needsUpdate = true;
}
