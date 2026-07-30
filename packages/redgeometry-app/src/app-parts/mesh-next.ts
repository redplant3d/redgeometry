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
import { APP_INPUT_START_SYSTEM_ID } from "../ecs-modules/app-input.ts";
import {
    APP_MODULE_ID,
    APP_START_SYSTEM_ID,
    APP_UPDATE_SYSTEM_ID,
    appModule,
    START_SCHEDULE_ID,
    UPDATE_SCHEDULE_ID,
    type AppInputData,
} from "../ecs-modules/app.ts";
import { KeyboardButtons, KeyboardPlugin, MouseButtons, MousePlugin } from "../ecs-modules/input.ts";
import { WorldContext, type World } from "../ecs/world.ts";
import { ButtonInputElement } from "../utility/html-element.ts";

type MeshNextInputData = {
    dataId: "mesh-next-input-data";
    inputPrint: ButtonInputElement;
};

type MeshNextStateData = {
    dataId: "mesh-next-state-data";
    mesh: Mesh2<unknown, unknown, unknown, unknown>;
    meshShell: MeshShellIdx | undefined;
    needsValidate: boolean;
    vtxFrom: MeshVertexIdx | undefined;
    edgeFrom: MeshEdgeIdx | undefined;
};

type MeshNextCommandEvent = {
    eventId: "mesh-next-command-event";
    command: "print" | "stringify" | "clear";
};

const MESH_NEXT_START_SYSTEM_ID = "mesh-next-start-system";
const MESH_NEXT_UPDATE_SYSTEM_ID = "mesh-next-update-system";
const MESH_NEXT_COMMAND_SYSTEM_ID = "mesh-next-command-system";
const MESH_NEXT_RENDER_SYSTEM_ID = "mesh-next-render-system";

function meshNextStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputPrint = new ButtonInputElement("print", "print");
    inputPrint.addEventListener("click", () => {
        world.addEvent<MeshNextCommandEvent>({ eventId: "mesh-next-command-event", command: "print" });
    });
    inputElements.push(inputPrint);

    const inputStringify = new ButtonInputElement("stringify", "stringify");
    inputStringify.addEventListener("click", () => {
        world.addEvent<MeshNextCommandEvent>({ eventId: "mesh-next-command-event", command: "stringify" });
    });
    inputElements.push(inputStringify);

    const inputClear = new ButtonInputElement("clear", "clear");
    inputClear.addEventListener("click", () => {
        world.addEvent<MeshNextCommandEvent>({ eventId: "mesh-next-command-event", command: "clear" });
    });
    inputElements.push(inputClear);

    world.setData<MeshNextInputData>({
        dataId: "mesh-next-input-data",
        inputPrint,
    });

    world.setData<MeshNextStateData>({
        dataId: "mesh-next-state-data",
        mesh: Mesh.createEmpty(),
        meshShell: undefined,
        needsValidate: false,
        vtxFrom: undefined,
        edgeFrom: undefined,
    });
}

function meshNextUpdateSystem(world: World): void {
    const keyboardPlugin = world.getPlugin<KeyboardPlugin>("keyboard-plugin");
    const mousePlugin = world.getPlugin<MousePlugin>("mouse-plugin");
    const StateData = world.getData<MeshNextStateData>("mesh-next-state-data");

    const pos = Vector2.fromObject(mousePlugin.getCursorPosition());
    const mesh = StateData.mesh;
    const vtxFrom = StateData.vtxFrom;
    const edgeFrom = StateData.edgeFrom;
    const shell = StateData.meshShell;

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_A)) {
        if (shell !== undefined) {
            const face = mesh2FindFaceAt(mesh, pos, WindingOperator.POSITIVE);
            const firstFace = mesh.shells.getFirstFace(shell);
            mesh2AddVertex(mesh, pos, face !== undefined ? face : firstFace);
        } else {
            const vfs = mesh2AddVertexFaceShell(mesh, pos);
            StateData.meshShell = vfs.shell;
        }
        StateData.needsValidate = true;
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_Q)) {
        const vtx = mesh2FindClosestVertexAt(mesh, pos);
        if (shell !== undefined && vtx !== undefined && isVertexClose(mesh, vtx, pos, 10)) {
            mesh2RemoveVertexAndEdges(mesh, vtx);

            if (!mesh.shells.isValid(shell)) {
                mesh.truncate();
                StateData.meshShell = undefined;
                log.info("Truncating mesh");
            }

            StateData.vtxFrom = undefined;
            StateData.needsValidate = true;
        }
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_S)) {
        const edge = mesh2FindClosestEdgeAt(mesh, pos);
        if (edge !== undefined && isEdgeClose(mesh, edge, pos, 10)) {
            mesh2SplitEdgeAt(mesh, edge, pos);
            StateData.needsValidate = true;
        }
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_W)) {
        const vtx = mesh2FindClosestVertexAt(mesh, pos);
        if (vtx !== undefined && isVertexClose(mesh, vtx, pos, 10)) {
            const success = mesh2MergeEdgeAt(mesh, vtx, -1);
            if (!success) {
                log.warn("Unable to merge edges at vertex");
            }
            StateData.needsValidate = true;
        }
    }

    if (keyboardPlugin.isPressed(KeyboardButtons.KEY_D)) {
        const edge = mesh2FindClosestEdgeAt(mesh, pos);
        if (shell !== undefined && edge !== undefined && isEdgeClose(mesh, edge, pos, 10)) {
            const face = mesh.shells.getFirstFace(shell);
            mesh2RemoveEdge(mesh, edge, face);
            StateData.needsValidate = true;
        }
    }

    if (mousePlugin.isPressed(MouseButtons.MOUSE_1)) {
        const vtx = mesh2FindClosestVertexAt(mesh, pos);
        if (vtx !== undefined && isVertexClose(mesh, vtx, pos, 10)) {
            StateData.vtxFrom = vtx;
        } else {
            StateData.vtxFrom = undefined;
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
            StateData.vtxFrom = undefined;
            StateData.needsValidate = true;
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
                StateData.vtxFrom = vtx;
            } else {
                StateData.vtxFrom = nextVtx;
            }

            StateData.edgeFrom = edge;
            console.log("Found edge");
        } else {
            StateData.vtxFrom = undefined;
            StateData.edgeFrom = undefined;
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
            StateData.vtxFrom = undefined;
            StateData.edgeFrom = undefined;
            StateData.needsValidate = true;
        }
    }

    if (StateData.needsValidate) {
        const vh = meshValidate(mesh);

        for (const error of vh.errors) {
            log.error("{}", error);
        }

        if (vh.errors.length > 0) {
            meshPrint(mesh);
        }

        StateData.needsValidate = false;
    }
}

function commandEventSystem(world: World): void {
    const commandEvents = world.getEvents<MeshNextCommandEvent>("mesh-next-command-event");
    const StateData = world.getData<MeshNextStateData>("mesh-next-state-data");

    const mesh = StateData.mesh;

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
                if (StateData.meshShell !== undefined) {
                    mesh2RemoveShell(mesh, StateData.meshShell);
                    mesh.truncate();
                    StateData.meshShell = undefined;
                    StateData.needsValidate = true;
                }
                break;
            }
        }
    }
}

function meshNextRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");
    const { mesh } = world.getData<MeshNextStateData>("mesh-next-state-data");

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

export const MESH_NEXT_APP_PART_MODULE_ID = "mesh-next-app-part-module";

export function meshNextAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<MeshNextInputData>("mesh-next-input-data");
    context.addData<MeshNextStateData>("mesh-next-state-data");

    context.addEvent<MeshNextCommandEvent>("mesh-next-command-event");

    context.addSystem({
        id: MESH_NEXT_START_SYSTEM_ID,
        fn: meshNextStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: MESH_NEXT_UPDATE_SYSTEM_ID,
        fn: meshNextUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: MESH_NEXT_COMMAND_SYSTEM_ID,
        fn: commandEventSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: MESH_NEXT_RENDER_SYSTEM_ID,
        fn: meshNextRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, MESH_NEXT_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, MESH_NEXT_UPDATE_SYSTEM_ID, MESH_NEXT_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
