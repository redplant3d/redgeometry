import { World } from "redgeometry/src/ecs";
import { Matrix4x4 } from "redgeometry/src/primitives";
import { MeshComponent, MeshMaterial } from "redgeometry/src/render-webgpu";
import { AppContextGPU } from "../context";
import { ComboBoxInputElement, RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

export class WebGpuTestAppPart implements AppPart {
    private context: AppContextGPU;
    private launcher: AppLauncher;

    public inputProjection: ComboBoxInputElement;
    public inputRotation: RangeInputElement;
    public world: World;

    public constructor(launcher: AppLauncher, context: AppContextGPU) {
        this.launcher = launcher;
        this.context = context;

        this.inputRotation = new RangeInputElement("rotation", "0", "200", "100");
        this.inputRotation.setStyle("width: 200px");

        this.inputProjection = new ComboBoxInputElement("projection", "orthographic");
        this.inputProjection.setOptionValues("orthographic", "perspective");

        // const device = context.device;

        this.world = new World();
    }

    public create(): void {
        this.reset();

        const d = 5;

        this.world.createEntity<[MeshComponent]>({
            componentId: "mesh",
            material: MATERIAL_RED_LINE,
            vertices: { type: "Number", array: [-1000, 0, 0, 1000, 0, 0] },
        });

        this.world.createEntity<[MeshComponent]>({
            componentId: "mesh",
            material: MATERIAL_GREEN_LINE,
            vertices: { type: "Number", array: [0, -1000, 0, 0, 1000, 0] },
        });

        this.world.createEntity<[MeshComponent]>({
            componentId: "mesh",
            material: MATERIAL_BLUE_LINE,
            vertices: { type: "Number", array: [0, 0, -1000, 0, 0, 1000] },
        });

        this.world.createEntity<[MeshComponent]>({
            componentId: "mesh",
            material: MATERIAL_PLANE,
            vertices: { type: "Number", array: [d, 0, d, d, 0, -d, -d, 0, d, -d, 0, -d, -d, 0, d, d, 0, -d] },
        });
    }

    public render(): void {
        const ctx = this.context;

        // const worldMat = this.createWorldMatrix(ctx.width, ctx.height).toArray(true);
        const colorAttachments: GPURenderPassColorAttachment[] = [
            {
                view: ctx.currentTextureView,
                clearValue: { r: 1, g: 1, b: 1, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            },
        ];

        const commandEncoder = ctx.device.createCommandEncoder();
        const renderPassEncoder = commandEncoder.beginRenderPass({ colorAttachments });

        // this.meshRenderSystem.renderPass(renderPassEncoder, worldMat);

        renderPassEncoder.end();

        const commandBuffer = commandEncoder.finish();

        ctx.device.queue.submit([commandBuffer]);
    }

    public reset(): void {
        this.world.clearEntities();
    }

    public update(_delta: number): void {
        this.context.beginFrame();
        this.world.update();
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputRotation);
        this.launcher.addAppInput(this.inputProjection);
    }

    private createWorldMatrix(width: number, height: number): Matrix4x4 {
        const rotation = parseInt(this.inputRotation.getValue());

        const d = (rotation * Math.PI) / 180;

        const model = Matrix4x4.identity;
        model.rotateYAnglePre(d);

        const view = Matrix4x4.identity;
        view.rotateXAnglePre(0.5);
        view.translatePre(0, 0, -15);

        let projection;

        if (this.inputProjection.getValue() === "orthographic") {
            projection = Matrix4x4.fromOrthographic(-10, 10, 10, -10, 1, 2000);
        } else {
            projection = Matrix4x4.fromPerspectiveFrustum(65, width / height, 1, 2000);
        }

        projection.translatePre(0, 0, 1);
        projection.scalePre(1, 1, 0.5);

        return projection.mul(view).mul(model);
    }
}

const MATERIAL_RED_LINE: Readonly<MeshMaterial> = {
    color: { r: 1, g: 0, b: 0, a: 0 },
    topology: "line-list",
};

const MATERIAL_GREEN_LINE: Readonly<MeshMaterial> = {
    color: { r: 0, g: 1, b: 0, a: 0 },
    topology: "line-list",
};

const MATERIAL_BLUE_LINE: Readonly<MeshMaterial> = {
    color: { r: 0, g: 0, b: 1, a: 0 },
    topology: "line-list",
};

const MATERIAL_PLANE: Readonly<MeshMaterial> = {
    color: { r: 0.5, g: 0.5, b: 0.5, a: 0.7 },
    topology: "triangle-list",
};
