import { WindingOperator } from "redgeometry/src/core/winding";
import { log } from "redgeometry/src/internal/log";
import {
    Mesh,
    mesh2AddEdge,
    mesh2AddVertex,
    mesh2AddVertexFaceShell,
    mesh2FindClosestEdgeAt,
    mesh2FindClosestLinkAt,
    mesh2FindClosestVertexAt,
    mesh2FindFaceAt,
    mesh2MergeEdgeAt,
    mesh2MergeLink,
    mesh2RemoveEdge,
    mesh2RemoveShell,
    mesh2RemoveVertexAndEdges,
    mesh2SplitEdgeAt,
    mesh2SplitLink,
    meshPrint,
    meshValidate,
    type Mesh2,
    type MeshEdgeIdx,
    type MeshShellIdx,
    type MeshVertexIdx,
} from "redgeometry/src/internal/mesh-next";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { ButtonInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import { KeyboardButtons, KeyboardPlugin, MouseButtons, MousePlugin } from "../ecs-modules/input.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputPrint: ButtonInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    mesh: Mesh2<unknown, unknown, unknown, unknown>;
    meshShell: MeshShellIdx | undefined;
    needsValidate: boolean;
    vtxFrom: MeshVertexIdx | undefined;
    edgeFrom: MeshEdgeIdx | undefined;
};

type AppPartStateData = {
    dataId: "app-part-state-data";
};

type AppPartCommandEvent = {
    eventId: "app-part-command-event";
    command: "print" | "stringify" | "clear";
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

    const inputPrint = new ButtonInputElement("print", "print");
    inputPrint.addEventListener("click", () => {
        world.writeEvent<AppPartCommandEvent>({ eventId: "app-part-command-event", command: "print" });
    });
    inputElements.push(inputPrint);

    const inputStringify = new ButtonInputElement("stringify", "stringify");
    inputStringify.addEventListener("click", () => {
        world.writeEvent<AppPartCommandEvent>({ eventId: "app-part-command-event", command: "stringify" });
    });
    inputElements.push(inputStringify);

    const inputClear = new ButtonInputElement("clear", "clear");
    inputClear.addEventListener("click", () => {
        world.writeEvent<AppPartCommandEvent>({ eventId: "app-part-command-event", command: "clear" });
    });
    inputElements.push(inputClear);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main-data",
        inputPrint,
    });

    console.clear();
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        mesh: Mesh.createEmpty(),
        meshShell: undefined,
        needsValidate: false,
        vtxFrom: undefined,
        edgeFrom: undefined,
    });
}

function writeStateSystem(world: World): void {
    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const keyboardPlugin = world.getPlugin<KeyboardPlugin>("keyboard-plugin");
    const mousePlugin = world.getPlugin<MousePlugin>("mouse-plugin");
    const remoteData = world.readData<AppPartRemoteData>("app-part-remote-data");

    const pos = Vector2.fromObject(mousePlugin.getCursorPosition());
    const mesh = remoteData.mesh;
    const vtxFrom = remoteData.vtxFrom;
    const edgeFrom = remoteData.edgeFrom;
    const shell = remoteData.meshShell;

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_A)) {
        if (shell !== undefined) {
            const face = mesh2FindFaceAt(mesh, pos, WindingOperator.POSITIVE);
            const firstFace = mesh.shells.getFirstFace(shell);
            mesh2AddVertex(mesh, pos, face !== undefined ? face : firstFace);
        } else {
            const vfs = mesh2AddVertexFaceShell(mesh, pos);
            remoteData.meshShell = vfs.shell;
        }
        remoteData.needsValidate = true;
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_Q)) {
        const vtx = mesh2FindClosestVertexAt(mesh, pos);
        if (shell !== undefined && vtx !== undefined && isVertexClose(mesh, vtx, pos, 10)) {
            mesh2RemoveVertexAndEdges(mesh, vtx);

            if (!mesh.shells.isValid(shell)) {
                mesh.truncate();
                remoteData.meshShell = undefined;
                log.info("Truncating mesh");
            }

            remoteData.vtxFrom = undefined;
            remoteData.needsValidate = true;
        }
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_S)) {
        const edge = mesh2FindClosestEdgeAt(mesh, pos);
        if (edge !== undefined && isEdgeClose(mesh, edge, pos, 10)) {
            mesh2SplitEdgeAt(mesh, edge, pos);
            remoteData.needsValidate = true;
        }
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_W)) {
        const vtx = mesh2FindClosestVertexAt(mesh, pos);
        if (vtx !== undefined && isVertexClose(mesh, vtx, pos, 10)) {
            const success = mesh2MergeEdgeAt(mesh, vtx, -1);
            if (!success) {
                log.warn("Unable to merge edges at vertex");
            }
            remoteData.needsValidate = true;
        }
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_D)) {
        const edge = mesh2FindClosestEdgeAt(mesh, pos);
        if (shell !== undefined && edge !== undefined && isEdgeClose(mesh, edge, pos, 10)) {
            const face = mesh.shells.getFirstFace(shell);
            mesh2RemoveEdge(mesh, edge, face);
            remoteData.needsValidate = true;
        }
    }

    if (mousePlugin.isPressed(MouseButtons.MOUSE_1)) {
        const vtx = mesh2FindClosestVertexAt(mesh, pos);
        if (vtx !== undefined && isVertexClose(mesh, vtx, pos, 10)) {
            remoteData.vtxFrom = vtx;
        } else {
            remoteData.vtxFrom = undefined;
        }
    }

    if (mousePlugin.isReleased(MouseButtons.MOUSE_1)) {
        if (vtxFrom !== undefined) {
            const vtxTo = mesh2FindClosestVertexAt(mesh, pos);
            if (vtxTo !== undefined && vtxTo !== vtxFrom && isVertexClose(mesh, vtxTo, pos, 10)) {
                const ee = mesh2AddEdge(mesh, vtxTo, vtxFrom);
                if (ee === undefined) {
                    log.warn("Unable to add edge");
                }
            } else {
                mesh.vertices.setPos(vtxFrom, pos);
            }
            remoteData.vtxFrom = undefined;
            remoteData.needsValidate = true;
        }
    }

    if (mousePlugin.isPressed(MouseButtons.MOUSE_3)) {
        const edge = mesh2FindClosestLinkAt(mesh, pos);
        if (edge !== undefined && isEdgeClose(mesh, edge, pos, 50)) {
            const link = mesh.edges.getLink(edge);
            const loop = mesh.links.getLoop(link);
            const face = mesh.loops.getFace(loop);
            const nextVtx = mesh2SplitLink(mesh, link, face);

            if (nextVtx === undefined) {
                const vtx = mesh.links.getVertex(link);
                remoteData.vtxFrom = vtx;
            } else {
                remoteData.vtxFrom = nextVtx;
            }

            remoteData.edgeFrom = edge;
            console.log("Found edge");
        } else {
            remoteData.vtxFrom = undefined;
            remoteData.edgeFrom = undefined;
        }
    }

    if (mousePlugin.isReleased(MouseButtons.MOUSE_3)) {
        if (vtxFrom !== undefined) {
            const vtxTo = mesh2FindClosestVertexAt(mesh, pos);
            if (vtxTo !== undefined && edgeFrom !== undefined && isVertexClose(mesh, vtxTo, pos, 10)) {
                const link = mesh.edges.getLink(edgeFrom);
                const face = mesh2MergeLink(mesh, link, vtxTo);
                if (face === undefined) {
                    log.warn("Unable to merge link");
                }
            } else {
                mesh.vertices.setPos(vtxFrom, pos);
            }
            remoteData.vtxFrom = undefined;
            remoteData.edgeFrom = undefined;
            remoteData.needsValidate = true;
        }
    }

    if (remoteData.needsValidate) {
        const vh = meshValidate(mesh);

        for (const error of vh.errors) {
            log.error("{}", error);
        }

        if (vh.errors.length > 0) {
            meshPrint(mesh);
        }

        remoteData.needsValidate = false;
    }
}

function commandEventSystem(world: World): void {
    const commandEvents = world.readEvents<AppPartCommandEvent>("app-part-command-event");
    const remoteData = world.readData<AppPartRemoteData>("app-part-remote-data");

    const mesh = remoteData.mesh;

    while (commandEvents.next()) {
        const ev = commandEvents.getEvent();

        switch (ev.command) {
            case "print": {
                meshPrint(mesh);
                break;
            }
            case "stringify": {
                const json = JSON.stringify(Mesh.toObject(mesh));
                log.info("{}", json);
                break;
            }
            case "clear": {
                if (remoteData.meshShell !== undefined) {
                    mesh2RemoveShell(mesh, remoteData.meshShell);
                    mesh.truncate();
                    remoteData.meshShell = undefined;
                    remoteData.needsValidate = true;
                }
                break;
            }
        }
    }
}

function renderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");
    const { mesh } = world.readData<AppPartRemoteData>("app-part-remote-data");

    ctx.clear();
    ctx.drawMesh2Next(mesh);
}

function isEdgeClose<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    edge: MeshEdgeIdx,
    pos: ReadonlyVector2,
    threshold: number,
): boolean {
    const edgeLink = mesh.edges.getLink(edge);

    const edgeLinkOrig = mesh.links.getVertex(edgeLink);
    const edgeLinkDest = mesh.links.getVertexSym(edgeLink);

    const p0 = mesh.vertices.getPos(edgeLinkOrig);
    const p1 = mesh.vertices.getPos(edgeLinkDest);

    const e = new Edge2(p0, p1);

    return e.closestPointDistance(pos) < threshold;
}

function isVertexClose<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    vtx: MeshVertexIdx,
    pos: ReadonlyVector2,
    threshold: number,
): boolean {
    const vtxPos = mesh.vertices.getPos(vtx);
    return vtxPos.distance(pos) < threshold;
}

export class MeshNextAppPartModule implements WorldModule {
    public readonly moduleId = "mesh-next-app-part-module";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({
            stage: "update",
            fns: [updateSystem, commandEventSystem, renderSystem],
        });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}
