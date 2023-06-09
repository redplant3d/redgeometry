import { World, type EntityId } from "../ecs";
import { gpuCreateBuffer, type Float32Buffer, type NumberBuffer } from "./buffer";

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

export class MeshRenderSystem {
    private bindGroup0: GPUBindGroup;
    private device: GPUDevice;
    private entries: Map<EntityId, MeshRenderEntry>;
    private pipeline: GPURenderPipeline;
    private pipelineContext: GPUPipelineContext;

    constructor(device: GPUDevice, colorTargets: GPUColorTargetState[]) {
        this.device = device;

        this.entries = new Map();

        this.pipelineContext = this.createPipelineContext(colorTargets);
        this.bindGroup0 = this.createBindGroup0(this.pipelineContext);
        this.pipeline = this.createRenderPipelineState(this.pipelineContext);
    }

    public renderPass(encoder: GPURenderPassEncoder, _worldMat: number[]): void {
        encoder.setBindGroup(0, this.bindGroup0);

        for (const entry of this.entries.values()) {
            encoder.setPipeline(entry.pipeline);
            encoder.setBindGroup(1, entry.bindGroup1);
            encoder.setVertexBuffer(0, entry.vertexBuffer);
            encoder.draw(entry.vertexCount, 1, 0, 0);
        }
    }

    public update(world: World): void {
        const query = world.queryEntities<[MeshComponent]>(["mesh"]);

        for (const { entity, components } of query) {
            const entry = this.entries.get(entity);

            if (entry === undefined) {
                const entry = this.createMeshEntry(components.mesh);
                this.entries.set(entity, entry);
            } else {
                this.destroyMeshEntry(entry);
                this.entries.delete(entity);
            }
        }
    }

    private createBindGroup0(pipelineContext: GPUPipelineContext): GPUBindGroup {
        return this.device.createBindGroup({
            entries: [],
            layout: pipelineContext.bindGroupLayouts[0],
        });
    }

    private createColorBuffer(device: GPUDevice, color: GPUColorDict): GPUBuffer {
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

    private createMeshEntry(component: MeshComponent): MeshRenderEntry {
        const { material, vertices } = component;
        const vertexCount = vertices.array.length;
        const vertexBuffer = gpuCreateBuffer(this.device, vertices, GPUBufferUsage.VERTEX);
        const colorBuffer = this.createColorBuffer(this.device, material.color);
        const pipeline = this.pipeline;

        const bindGroup1 = this.device.createBindGroup({
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: colorBuffer,
                    },
                },
            ],
            layout: this.pipelineContext.bindGroupLayouts[1],
        });

        return {
            component,
            colorBuffer,
            vertexBuffer,
            vertexCount,
            pipeline,
            bindGroup1,
        };
    }

    private createPipelineContext(colorTargets: GPUColorTargetState[]): GPUPipelineContext {
        const shaderModule = this.device.createShaderModule({
            code: MESH_RENDER_WGSL,
        });

        const vertexState: GPUVertexState = {
            module: shaderModule,
            entryPoint: "vertex_main",
            buffers: [{ attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }], arrayStride: 12 }],
        };
        const fragmentState: GPUFragmentState = {
            module: shaderModule,
            entryPoint: "fragment_main",
            targets: colorTargets,
        };

        const bindGroupLayoutDescriptors: GPUBindGroupLayoutDescriptor[] = [
            { entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }] },
            { entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }] },
        ];

        const bindGroupLayouts = bindGroupLayoutDescriptors.map((d) => this.device.createBindGroupLayout(d));
        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts });

        return { vertexState, fragmentState, bindGroupLayouts, pipelineLayout };
    }

    private createRenderPipelineState(ctx: GPUPipelineContext): GPURenderPipeline {
        const renderPipelineDescriptor: GPURenderPipelineDescriptor = {
            vertex: ctx.vertexState,
            fragment: ctx.fragmentState,
            primitive: { topology: "triangle-list" },
            layout: ctx.pipelineLayout,
        };

        return this.device.createRenderPipeline(renderPipelineDescriptor);
    }

    private destroyMeshEntry(entry: MeshRenderEntry): void {
        entry.vertexBuffer.destroy();
        entry.colorBuffer.destroy();
    }
}

// prettier-ignore
export const MESH_RENDER_WGSL =
`struct VertexIn {
    @location(0)
    position: vec3<f32>,
};

struct VertexOut {
    @builtin(position)
    position: vec4<f32>,
};

struct FragmentOut {
    @location(0)
    color: vec4<f32>,
};

@group(0) @binding(0)
var<uniform> world: mat4x4<f32>;

@group(1) @binding(0)
var<uniform> color: vec4<f32>;

@vertex
fn vertex_main(in: VertexIn) -> VertexOut {
    var pos = vec4<f32>(in.position, 1.0);
    var out: VertexOut;
    out.position = world * pos;
    return out;
}

@fragment
fn fragment_main() -> FragmentOut {
    var out: FragmentOut;
    out.color = color;
    return out;
}`;
