import { expect, test } from "vitest";
import {
    Mesh,
    mesh2AddEdge,
    mesh2AddVertex,
    mesh2AddVertexFaceShell,
    mesh2MergeEdgeAt,
    mesh2RemoveEdge,
    mesh2RemoveShell,
    mesh2RemoveVertex,
    mesh2SplitEdgeAt,
    MeshEdges,
    MeshFaces,
    MeshLinks,
    MeshLoops,
    MeshShells,
    MeshVertices,
    type MeshEdgeIdx,
    type MeshFaceIdx,
    type MeshLinkIdx,
    type MeshLoopIdx,
    type MeshShellIdx,
    type MeshVertexIdx,
} from "../../src/internal/mesh-next.ts";
import { Vector2, type ReadonlyVector2 } from "../../src/primitives/vector.ts";
import { expectNoMesh2Errors, expectToBeTrue } from "../expect.ts";

test("MeshVertices - createEmpty/create/init/reset/destroy/clear", () => {
    const vertices = MeshVertices.createEmpty<string, string>();
    expect(vertices.data).toEqual([]);
    expect(vertices.pos).toEqual([]);
    expect(vertices.firstLink).toEqual([]);
    expect(vertices.free).toEqual([]);
    expect(vertices.length).toEqual(0);

    const vtx = vertices.create("DATA", "POSITION");
    expect(vertices.data).toEqual(["DATA"]);
    expect(vertices.pos).toEqual(["POSITION"]);
    expect(vertices.firstLink).toEqual([-1]);
    expect(vertices.free).toEqual([]);
    expect(vertices.length).toEqual(1);

    vertices.init(vtx, 1 as MeshLinkIdx);
    expect(vertices.data).toEqual(["DATA"]);
    expect(vertices.pos).toEqual(["POSITION"]);
    expect(vertices.firstLink).toEqual([1]);
    expect(vertices.free).toEqual([]);
    expect(vertices.length).toEqual(1);

    vertices.reset(vtx);
    expect(vertices.data).toEqual(["DATA"]);
    expect(vertices.pos).toEqual(["POSITION"]);
    expect(vertices.firstLink).toEqual([-1]);
    expect(vertices.free).toEqual([]);
    expect(vertices.length).toEqual(1);

    vertices.destroy(vtx);
    expect(vertices.data).toEqual([null]);
    expect(vertices.pos).toEqual([null]);
    expect(vertices.firstLink).toEqual([-1]);
    expect(vertices.free).toEqual([0]);
    expect(vertices.length).toEqual(1);

    vertices.clear();
    expect(vertices.data).toEqual([]);
    expect(vertices.pos).toEqual([]);
    expect(vertices.firstLink).toEqual([]);
    expect(vertices.free).toEqual([]);
    expect(vertices.length).toEqual(0);
});

test("MeshVertices - truncate", () => {
    const vertices = MeshVertices.createEmpty<string, string>();
    expect(vertices.length).toEqual(0);

    const vtx0 = vertices.create("DATA", "POSITION");
    const vtx1 = vertices.create("DATA", "POSITION");
    const vtx2 = vertices.create("DATA", "POSITION");
    expect(vertices.length).toEqual(3);
    expect(vertices.free).toEqual([]);

    vertices.destroy(vtx2);
    vertices.destroy(vtx0);
    expect(vertices.length).toEqual(3);
    expect(vertices.free).toEqual([2, 0]);

    vertices.truncate();
    expect(vertices.length).toEqual(2);
    expect(vertices.free).toEqual([0]);

    vertices.destroy(vtx1);
    expect(vertices.length).toEqual(2);
    expect(vertices.free).toEqual([0, 1]);

    vertices.truncate();
    expect(vertices.length).toEqual(0);
    expect(vertices.free).toEqual([]);
});

test("MeshEdges - createEmpty/create/init/reset/destroy/clear", () => {
    const edges = MeshEdges.createEmpty<string>();
    expect(edges.data).toEqual([]);
    expect(edges.link).toEqual([]);
    expect(edges.free).toEqual([]);
    expect(edges.length).toEqual(0);

    const edge = edges.create("DATA");
    expect(edges.data).toEqual(["DATA"]);
    expect(edges.link).toEqual([-1]);
    expect(edges.free).toEqual([]);
    expect(edges.length).toEqual(1);

    edges.init(edge, 1 as MeshLinkIdx);
    expect(edges.data).toEqual(["DATA"]);
    expect(edges.link).toEqual([1]);
    expect(edges.free).toEqual([]);
    expect(edges.length).toEqual(1);

    edges.reset(edge);
    expect(edges.data).toEqual(["DATA"]);
    expect(edges.link).toEqual([-1]);
    expect(edges.free).toEqual([]);
    expect(edges.length).toEqual(1);

    edges.destroy(edge);
    expect(edges.data).toEqual([null]);
    expect(edges.link).toEqual([-1]);
    expect(edges.free).toEqual([0]);
    expect(edges.length).toEqual(1);

    edges.clear();
    expect(edges.data).toEqual([]);
    expect(edges.link).toEqual([]);
    expect(edges.free).toEqual([]);
    expect(edges.length).toEqual(0);
});

test("MeshEdges - truncate", () => {
    const edges = MeshEdges.createEmpty<string>();
    expect(edges.length).toEqual(0);

    const edge0 = edges.create("DATA");
    const edge1 = edges.create("DATA");
    const edge2 = edges.create("DATA");
    expect(edges.length).toEqual(3);
    expect(edges.free).toEqual([]);

    edges.destroy(edge2);
    edges.destroy(edge0);
    expect(edges.length).toEqual(3);
    expect(edges.free).toEqual([2, 0]);

    edges.truncate();
    expect(edges.length).toEqual(2);
    expect(edges.free).toEqual([0]);

    edges.destroy(edge1);
    expect(edges.length).toEqual(2);
    expect(edges.free).toEqual([0, 1]);

    edges.truncate();
    expect(edges.length).toEqual(0);
    expect(edges.free).toEqual([]);
});

test("MeshFaces - createEmpty/create/init/reset/destroy/clear", () => {
    const faces = MeshFaces.createEmpty<string>();
    expect(faces.data).toEqual([]);
    expect(faces.firstLoop).toEqual([]);
    expect(faces.free).toEqual([]);
    expect(faces.length).toEqual(0);

    const face = faces.create("DATA");
    expect(faces.data).toEqual(["DATA"]);
    expect(faces.firstLoop).toEqual([-1]);
    expect(faces.next).toEqual([-1]);
    expect(faces.prev).toEqual([-1]);
    expect(faces.shell).toEqual([-1]);
    expect(faces.free).toEqual([]);
    expect(faces.length).toEqual(1);

    faces.init(face, 1 as MeshShellIdx, 2 as MeshLoopIdx);
    expect(faces.data).toEqual(["DATA"]);
    expect(faces.shell).toEqual([1]);
    expect(faces.firstLoop).toEqual([2]);
    expect(faces.next).toEqual([0]);
    expect(faces.prev).toEqual([0]);
    expect(faces.free).toEqual([]);
    expect(faces.length).toEqual(1);

    faces.reset(face);
    expect(faces.data).toEqual(["DATA"]);
    expect(faces.firstLoop).toEqual([-1]);
    expect(faces.next).toEqual([-1]);
    expect(faces.prev).toEqual([-1]);
    expect(faces.shell).toEqual([-1]);
    expect(faces.free).toEqual([]);
    expect(faces.length).toEqual(1);

    faces.destroy(face);
    expect(faces.data).toEqual([null]);
    expect(faces.firstLoop).toEqual([-1]);
    expect(faces.next).toEqual([-1]);
    expect(faces.prev).toEqual([-1]);
    expect(faces.shell).toEqual([-1]);
    expect(faces.free).toEqual([0]);
    expect(faces.length).toEqual(1);

    faces.clear();
    expect(faces.data).toEqual([]);
    expect(faces.firstLoop).toEqual([]);
    expect(faces.next).toEqual([]);
    expect(faces.prev).toEqual([]);
    expect(faces.shell).toEqual([]);
    expect(faces.free).toEqual([]);
    expect(faces.length).toEqual(0);
});

test("MeshFaces - truncate", () => {
    const faces = MeshFaces.createEmpty<string>();
    expect(faces.length).toEqual(0);

    const face0 = faces.create("DATA");
    const face1 = faces.create("DATA");
    const face2 = faces.create("DATA");
    expect(faces.length).toEqual(3);
    expect(faces.free).toEqual([]);

    faces.destroy(face2);
    faces.destroy(face0);
    expect(faces.length).toEqual(3);
    expect(faces.free).toEqual([2, 0]);

    faces.truncate();
    expect(faces.length).toEqual(2);
    expect(faces.free).toEqual([0]);

    faces.destroy(face1);
    expect(faces.length).toEqual(2);
    expect(faces.free).toEqual([0, 1]);

    faces.truncate();
    expect(faces.length).toEqual(0);
    expect(faces.free).toEqual([]);
});

test("MeshLinks - createEmpty/create/init/reset/destroy/clear", () => {
    const links = MeshLinks.createEmpty();
    expect(links.edge).toEqual([]);
    expect(links.loop).toEqual([]);
    expect(links.lnext).toEqual([]);
    expect(links.onext).toEqual([]);
    expect(links.vertex).toEqual([]);
    expect(links.sym).toEqual([]);
    expect(links.free).toEqual([]);
    expect(links.length).toEqual(0);

    const link = links.create();
    expect(links.edge).toEqual([-1]);
    expect(links.loop).toEqual([-1]);
    expect(links.lnext).toEqual([-1]);
    expect(links.onext).toEqual([-1]);
    expect(links.vertex).toEqual([-1]);
    expect(links.sym).toEqual([-1]);
    expect(links.free).toEqual([]);
    expect(links.length).toEqual(1);

    links.init(link, 1 as MeshLinkIdx, 2 as MeshEdgeIdx, 3 as MeshVertexIdx, 4 as MeshLoopIdx);
    expect(links.edge).toEqual([2]);
    expect(links.loop).toEqual([4]);
    expect(links.lnext).toEqual([1]);
    expect(links.onext).toEqual([0]);
    expect(links.vertex).toEqual([3]);
    expect(links.sym).toEqual([1]);
    expect(links.free).toEqual([]);

    links.reset(link);
    expect(links.edge).toEqual([-1]);
    expect(links.loop).toEqual([-1]);
    expect(links.lnext).toEqual([-1]);
    expect(links.onext).toEqual([-1]);
    expect(links.vertex).toEqual([-1]);
    expect(links.sym).toEqual([-1]);
    expect(links.free).toEqual([]);
    expect(links.length).toEqual(1);

    links.destroy(link);
    expect(links.edge).toEqual([-1]);
    expect(links.loop).toEqual([-1]);
    expect(links.lnext).toEqual([-1]);
    expect(links.onext).toEqual([-1]);
    expect(links.vertex).toEqual([-1]);
    expect(links.sym).toEqual([-1]);
    expect(links.free).toEqual([0]);
    expect(links.length).toEqual(1);

    links.clear();
    expect(links.edge).toEqual([]);
    expect(links.loop).toEqual([]);
    expect(links.lnext).toEqual([]);
    expect(links.onext).toEqual([]);
    expect(links.vertex).toEqual([]);
    expect(links.sym).toEqual([]);
    expect(links.free).toEqual([]);
    expect(links.length).toEqual(0);
});

test("MeshLinks - truncate", () => {
    const links = MeshLinks.createEmpty();
    expect(links.length).toEqual(0);

    const link0 = links.create();
    const link1 = links.create();
    const link2 = links.create();
    expect(links.length).toEqual(3);
    expect(links.free).toEqual([]);

    links.destroy(link2);
    links.destroy(link0);
    expect(links.length).toEqual(3);
    expect(links.free).toEqual([2, 0]);

    links.truncate();
    expect(links.length).toEqual(2);
    expect(links.free).toEqual([0]);

    links.destroy(link1);
    expect(links.length).toEqual(2);
    expect(links.free).toEqual([0, 1]);

    links.truncate();
    expect(links.length).toEqual(0);
    expect(links.free).toEqual([]);
});

test("MeshLoops - createEmpty/create/init/reset/destroy/clear", () => {
    const loops = MeshLoops.createEmpty();
    expect(loops.face).toEqual([]);
    expect(loops.firstLink).toEqual([]);
    expect(loops.next).toEqual([]);
    expect(loops.prev).toEqual([]);
    expect(loops.free).toEqual([]);
    expect(loops.length).toEqual(0);

    const loop = loops.create();
    expect(loops.face).toEqual([-1]);
    expect(loops.firstLink).toEqual([-1]);
    expect(loops.next).toEqual([-1]);
    expect(loops.prev).toEqual([-1]);
    expect(loops.free).toEqual([]);
    expect(loops.length).toEqual(1);

    loops.init(loop, 1 as MeshFaceIdx, 2 as MeshLinkIdx);
    expect(loops.face).toEqual([1]);
    expect(loops.firstLink).toEqual([2]);
    expect(loops.next).toEqual([0]);
    expect(loops.prev).toEqual([0]);
    expect(loops.free).toEqual([]);
    expect(loops.length).toEqual(1);

    loops.reset(loop);
    expect(loops.face).toEqual([-1]);
    expect(loops.firstLink).toEqual([-1]);
    expect(loops.next).toEqual([-1]);
    expect(loops.prev).toEqual([-1]);
    expect(loops.free).toEqual([]);
    expect(loops.length).toEqual(1);

    loops.destroy(loop);
    expect(loops.face).toEqual([-1]);
    expect(loops.firstLink).toEqual([-1]);
    expect(loops.next).toEqual([-1]);
    expect(loops.prev).toEqual([-1]);
    expect(loops.free).toEqual([0]);
    expect(loops.length).toEqual(1);

    loops.clear();
    expect(loops.face).toEqual([]);
    expect(loops.firstLink).toEqual([]);
    expect(loops.next).toEqual([]);
    expect(loops.prev).toEqual([]);
    expect(loops.free).toEqual([]);
    expect(loops.length).toEqual(0);
});

test("MeshLoops - truncate", () => {
    const loops = MeshLoops.createEmpty();
    expect(loops.length).toEqual(0);

    const loop0 = loops.create();
    const loop1 = loops.create();
    const loop2 = loops.create();
    expect(loops.length).toEqual(3);
    expect(loops.free).toEqual([]);

    loops.destroy(loop2);
    loops.destroy(loop0);
    expect(loops.length).toEqual(3);
    expect(loops.free).toEqual([2, 0]);

    loops.truncate();
    expect(loops.length).toEqual(2);
    expect(loops.free).toEqual([0]);

    loops.destroy(loop1);
    expect(loops.length).toEqual(2);
    expect(loops.free).toEqual([0, 1]);

    loops.truncate();
    expect(loops.length).toEqual(0);
    expect(loops.free).toEqual([]);
});

test("MeshShells - createEmpty/create/init/reset/destroy/clear", () => {
    const shells = MeshShells.createEmpty<string>();
    expect(shells.firstFace).toEqual([]);
    expect(shells.next).toEqual([]);
    expect(shells.prev).toEqual([]);
    expect(shells.free).toEqual([]);
    expect(shells.length).toEqual(0);

    const shell = shells.create("DATA");
    expect(shells.data).toEqual(["DATA"]);
    expect(shells.firstFace).toEqual([-1]);
    expect(shells.next).toEqual([-1]);
    expect(shells.prev).toEqual([-1]);
    expect(shells.free).toEqual([]);
    expect(shells.length).toEqual(1);

    shells.init(shell, 1 as MeshFaceIdx);
    expect(shells.data).toEqual(["DATA"]);
    expect(shells.firstFace).toEqual([1]);
    expect(shells.next).toEqual([0]);
    expect(shells.prev).toEqual([0]);
    expect(shells.free).toEqual([]);
    expect(shells.length).toEqual(1);

    shells.reset(shell);
    expect(shells.data).toEqual(["DATA"]);
    expect(shells.firstFace).toEqual([-1]);
    expect(shells.next).toEqual([-1]);
    expect(shells.prev).toEqual([-1]);
    expect(shells.free).toEqual([]);
    expect(shells.length).toEqual(1);

    shells.destroy(shell);
    expect(shells.data).toEqual([null]);
    expect(shells.firstFace).toEqual([-1]);
    expect(shells.next).toEqual([-1]);
    expect(shells.prev).toEqual([-1]);
    expect(shells.free).toEqual([0]);
    expect(shells.length).toEqual(1);

    shells.clear();
    expect(shells.data).toEqual([]);
    expect(shells.firstFace).toEqual([]);
    expect(shells.next).toEqual([]);
    expect(shells.prev).toEqual([]);
    expect(shells.free).toEqual([]);
    expect(shells.length).toEqual(0);
});

test("MeshShells - truncate", () => {
    const shells = MeshShells.createEmpty<string>();
    expect(shells.length).toEqual(0);

    const loop0 = shells.create("DATA");
    const loop1 = shells.create("DATA");
    const loop2 = shells.create("DATA");
    expect(shells.length).toEqual(3);
    expect(shells.free).toEqual([]);

    shells.destroy(loop2);
    shells.destroy(loop0);
    expect(shells.length).toEqual(3);
    expect(shells.free).toEqual([2, 0]);

    shells.truncate();
    expect(shells.length).toEqual(2);
    expect(shells.free).toEqual([0]);

    shells.destroy(loop1);
    expect(shells.length).toEqual(2);
    expect(shells.free).toEqual([0, 1]);

    shells.truncate();
    expect(shells.length).toEqual(0);
    expect(shells.free).toEqual([]);
});

test("Mesh2 - addVertexFaceShell/removeShell", () => {
    const mesh = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh, new Vector2(100, 100));
    expectNoMesh2Errors(mesh);

    mesh2RemoveShell(mesh, vfs1.shell);
    expectNoMesh2Errors(mesh);
});

test("Mesh2 - addVertex/removeVertex (Points)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();

    mesh2RemoveVertex(mesh1, vfs1.vertex);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveVertex(mesh2, vtx2);
    expectNoMesh2Errors(mesh2);
});

test("Mesh2 - addVertex/removeVertex (Line)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();

    mesh2RemoveVertex(mesh1, vfs1.vertex);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveVertex(mesh2, vtx2);
    expectNoMesh2Errors(mesh2);
});

test("Mesh2 - addVertex/removeVertex (Trident)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    const vtx4 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    mesh2AddEdge(mesh0, vfs1.vertex, vtx3);
    mesh2AddEdge(mesh0, vfs1.vertex, vtx4);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();

    mesh2RemoveVertex(mesh1, vfs1.vertex);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveVertex(mesh2, vtx2);
    expectNoMesh2Errors(mesh2);

    mesh2RemoveVertex(mesh3, vtx3);
    expectNoMesh2Errors(mesh3);
});

test("Mesh2 - addVertex/removeVertex (Triangle)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    mesh2AddEdge(mesh0, vtx2, vtx3);
    mesh2AddEdge(mesh0, vtx3, vfs1.vertex);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();

    mesh2RemoveVertex(mesh1, vfs1.vertex);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveVertex(mesh2, vtx2);
    expectNoMesh2Errors(mesh2);

    mesh2RemoveVertex(mesh3, vtx3);
    expectNoMesh2Errors(mesh2);
});

test("Mesh2 - addEdge/removeEdge (Line)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();

    const ee1 = mesh2AddEdge(mesh1, vfs1.vertex, vtx2);
    expectToBeTrue(ee1 !== undefined);
    expectNoMesh2Errors(mesh1);
    mesh2RemoveEdge(mesh1, ee1.edge1, -1);
    expectNoMesh2Errors(mesh1);

    const ee2 = mesh2AddEdge(mesh2, vfs1.vertex, vtx2);
    expectToBeTrue(ee2 !== undefined);
    expectNoMesh2Errors(mesh2);
    mesh2RemoveEdge(mesh2, ee2.edge2, -1);
    expectNoMesh2Errors(mesh2);
});

test("Mesh2 - addEdge/removeEdge (Trident)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    const vtx4 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    const ee1 = mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    const ee2 = mesh2AddEdge(mesh0, vfs1.vertex, vtx3);
    const ee3 = mesh2AddEdge(mesh0, vfs1.vertex, vtx4);
    expectToBeTrue(ee1 !== undefined);
    expectToBeTrue(ee2 !== undefined);
    expectToBeTrue(ee3 !== undefined);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();
    const mesh4 = mesh0.clone();
    const mesh5 = mesh0.clone();
    const mesh6 = mesh0.clone();

    mesh2RemoveEdge(mesh1, ee1.edge1, -1);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveEdge(mesh2, ee1.edge2, -1);
    expectNoMesh2Errors(mesh2);

    mesh2RemoveEdge(mesh3, ee2.edge1, -1);
    expectNoMesh2Errors(mesh3);

    mesh2RemoveEdge(mesh4, ee2.edge2, -1);
    expectNoMesh2Errors(mesh4);

    mesh2RemoveEdge(mesh5, ee3.edge1, -1);
    expectNoMesh2Errors(mesh5);

    mesh2RemoveEdge(mesh6, ee3.edge2, -1);
    expectNoMesh2Errors(mesh6);
});

test("Mesh2 - addEdge/removeEdge (Triangle)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    const ee1 = mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    const ee2 = mesh2AddEdge(mesh0, vtx2, vtx3);
    const ee3 = mesh2AddEdge(mesh0, vtx3, vfs1.vertex);
    expectToBeTrue(ee1 !== undefined);
    expectToBeTrue(ee2 !== undefined);
    expectToBeTrue(ee3 !== undefined);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();
    const mesh4 = mesh0.clone();
    const mesh5 = mesh0.clone();
    const mesh6 = mesh0.clone();

    mesh2RemoveEdge(mesh1, ee1.edge1, -1);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveEdge(mesh2, ee1.edge2, -1);
    expectNoMesh2Errors(mesh2);

    mesh2RemoveEdge(mesh3, ee2.edge1, -1);
    expectNoMesh2Errors(mesh3);

    mesh2RemoveEdge(mesh4, ee2.edge2, -1);
    expectNoMesh2Errors(mesh4);

    mesh2RemoveEdge(mesh5, ee3.edge1, -1);
    expectNoMesh2Errors(mesh5);

    mesh2RemoveEdge(mesh6, ee3.edge2, -1);
    expectNoMesh2Errors(mesh6);
});

test("Mesh2 - addEdge/removeEdge (Triangle with interior point)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    mesh2AddVertex(mesh0, new Vector2(200, 200), vfs1.face);
    const ee1 = mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    const ee2 = mesh2AddEdge(mesh0, vtx2, vtx3);
    const ee3 = mesh2AddEdge(mesh0, vtx3, vfs1.vertex);
    expectToBeTrue(ee1 !== undefined);
    expectToBeTrue(ee2 !== undefined);
    expectToBeTrue(ee3 !== undefined);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();
    const mesh4 = mesh0.clone();
    const mesh5 = mesh0.clone();
    const mesh6 = mesh0.clone();

    mesh2RemoveEdge(mesh1, ee1.edge1, -1);
    expectNoMesh2Errors(mesh1);

    mesh2RemoveEdge(mesh2, ee1.edge2, -1);
    expectNoMesh2Errors(mesh2);

    mesh2RemoveEdge(mesh3, ee2.edge1, -1);
    expectNoMesh2Errors(mesh3);

    mesh2RemoveEdge(mesh4, ee2.edge2, -1);
    expectNoMesh2Errors(mesh4);

    mesh2RemoveEdge(mesh5, ee3.edge1, -1);
    expectNoMesh2Errors(mesh5);

    mesh2RemoveEdge(mesh6, ee3.edge2, -1);
    expectNoMesh2Errors(mesh6);
});

test("Mesh2 - addEdge/removeEdge (Rectangle)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    const vtx4 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    mesh2AddEdge(mesh0, vtx2, vtx3);
    mesh2AddEdge(mesh0, vtx3, vtx4);
    mesh2AddEdge(mesh0, vtx4, vfs1.vertex);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();
    const mesh4 = mesh0.clone();
    const mesh5 = mesh0.clone();
    const mesh6 = mesh0.clone();
    const mesh7 = mesh0.clone();
    const mesh8 = mesh0.clone();

    const ee1a = mesh2AddEdge(mesh1, vfs1.vertex, vtx3);
    expectToBeTrue(ee1a !== undefined);
    expectNoMesh2Errors(mesh1);
    mesh2RemoveEdge(mesh1, ee1a.edge1, -1);
    expectNoMesh2Errors(mesh1);

    const ee1b = mesh2AddEdge(mesh2, vfs1.vertex, vtx3);
    expectToBeTrue(ee1b !== undefined);
    expectNoMesh2Errors(mesh2);
    mesh2RemoveEdge(mesh2, ee1b.edge2, -1);
    expectNoMesh2Errors(mesh2);

    const ee2a = mesh2AddEdge(mesh3, vtx3, vfs1.vertex);
    expectToBeTrue(ee2a !== undefined);
    expectNoMesh2Errors(mesh3);
    mesh2RemoveEdge(mesh3, ee2a.edge1, -1);
    expectNoMesh2Errors(mesh3);

    const ee2b = mesh2AddEdge(mesh4, vtx3, vfs1.vertex);
    expectToBeTrue(ee2b !== undefined);
    expectNoMesh2Errors(mesh4);
    mesh2RemoveEdge(mesh4, ee2b.edge2, -1);
    expectNoMesh2Errors(mesh4);

    const ee3a = mesh2AddEdge(mesh5, vtx2, vtx4);
    expectToBeTrue(ee3a !== undefined);
    expectNoMesh2Errors(mesh5);
    mesh2RemoveEdge(mesh5, ee3a.edge2, -1);
    expectNoMesh2Errors(mesh5);

    const ee3b = mesh2AddEdge(mesh6, vtx4, vtx2);
    expectToBeTrue(ee3b !== undefined);
    expectNoMesh2Errors(mesh6);
    mesh2RemoveEdge(mesh6, ee3b.edge1, -1);
    expectNoMesh2Errors(mesh6);

    const ee4a = mesh2AddEdge(mesh7, vtx4, vtx2);
    expectToBeTrue(ee4a !== undefined);
    expectNoMesh2Errors(mesh7);
    mesh2RemoveEdge(mesh7, ee4a.edge2, -1);
    expectNoMesh2Errors(mesh7);

    const ee4b = mesh2AddEdge(mesh8, vtx2, vtx4);
    expectToBeTrue(ee4b !== undefined);
    expectNoMesh2Errors(mesh8);
    mesh2RemoveEdge(mesh8, ee4b.edge1, -1);
    expectNoMesh2Errors(mesh8);
});

test("Mesh2 - splitEdgeAt/mergeEdgeAt (Line)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    const ee1 = mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    expectToBeTrue(ee1 !== undefined);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();

    const vee1 = mesh2SplitEdgeAt(mesh1, ee1.edge1, new Vector2(250, 250));
    expectNoMesh2Errors(mesh1);
    mesh2MergeEdgeAt(mesh1, vee1.vertex, -1);
    expectNoMesh2Errors(mesh1);

    const vee2 = mesh2SplitEdgeAt(mesh2, ee1.edge2, new Vector2(250, 250));
    expectNoMesh2Errors(mesh2);
    mesh2MergeEdgeAt(mesh2, vee2.vertex, -1);
    expectNoMesh2Errors(mesh2);
});

test("Mesh2 - splitEdgeAt/mergeEdgeAt (Trident)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(400, 400), vfs1.face);
    const vtx4 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    const ee1 = mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    const ee2 = mesh2AddEdge(mesh0, vfs1.vertex, vtx3);
    const ee3 = mesh2AddEdge(mesh0, vfs1.vertex, vtx4);
    expectToBeTrue(ee1 !== undefined);
    expectToBeTrue(ee2 !== undefined);
    expectToBeTrue(ee3 !== undefined);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();
    const mesh4 = mesh0.clone();
    const mesh5 = mesh0.clone();
    const mesh6 = mesh0.clone();

    const vee1 = mesh2SplitEdgeAt(mesh1, ee1.edge1, new Vector2(250, 100));
    expectNoMesh2Errors(mesh1);
    mesh2MergeEdgeAt(mesh1, vee1.vertex, -1);
    expectNoMesh2Errors(mesh1);

    const vee2 = mesh2SplitEdgeAt(mesh2, ee1.edge2, new Vector2(250, 100));
    expectNoMesh2Errors(mesh2);
    mesh2MergeEdgeAt(mesh2, vee2.vertex, -1);
    expectNoMesh2Errors(mesh2);

    const vee3 = mesh2SplitEdgeAt(mesh3, ee2.edge1, new Vector2(250, 250));
    expectNoMesh2Errors(mesh3);
    mesh2MergeEdgeAt(mesh3, vee3.vertex, -1);
    expectNoMesh2Errors(mesh3);

    const vee4 = mesh2SplitEdgeAt(mesh4, ee2.edge2, new Vector2(250, 250));
    expectNoMesh2Errors(mesh4);
    mesh2MergeEdgeAt(mesh4, vee4.vertex, -1);
    expectNoMesh2Errors(mesh4);

    const vee5 = mesh2SplitEdgeAt(mesh5, ee3.edge1, new Vector2(100, 250));
    expectNoMesh2Errors(mesh5);
    mesh2MergeEdgeAt(mesh5, vee5.vertex, -1);
    expectNoMesh2Errors(mesh5);

    const vee6 = mesh2SplitEdgeAt(mesh6, ee3.edge2, new Vector2(100, 250));
    expectNoMesh2Errors(mesh6);
    mesh2MergeEdgeAt(mesh6, vee6.vertex, -1);
    expectNoMesh2Errors(mesh6);
});

test("Mesh2 - splitEdgeAt/mergeEdgeAt (Triangle)", () => {
    const mesh0 = Mesh.createEmpty<unknown, unknown, unknown, unknown, ReadonlyVector2>();
    const vfs1 = mesh2AddVertexFaceShell(mesh0, new Vector2(100, 100));
    const vtx2 = mesh2AddVertex(mesh0, new Vector2(400, 100), vfs1.face);
    const vtx3 = mesh2AddVertex(mesh0, new Vector2(100, 400), vfs1.face);
    const ee1 = mesh2AddEdge(mesh0, vfs1.vertex, vtx2);
    const ee2 = mesh2AddEdge(mesh0, vtx2, vtx3);
    const ee3 = mesh2AddEdge(mesh0, vtx3, vfs1.vertex);
    expectToBeTrue(ee1 !== undefined);
    expectToBeTrue(ee2 !== undefined);
    expectToBeTrue(ee3 !== undefined);
    expectNoMesh2Errors(mesh0);

    const mesh1 = mesh0.clone();
    const mesh2 = mesh0.clone();
    const mesh3 = mesh0.clone();
    const mesh4 = mesh0.clone();
    const mesh5 = mesh0.clone();
    const mesh6 = mesh0.clone();

    const vee1 = mesh2SplitEdgeAt(mesh1, ee1.edge1, new Vector2(250, 100));
    expectNoMesh2Errors(mesh1);
    mesh2MergeEdgeAt(mesh1, vee1.vertex, -1);
    expectNoMesh2Errors(mesh1);

    const vee2 = mesh2SplitEdgeAt(mesh2, ee1.edge2, new Vector2(250, 100));
    expectNoMesh2Errors(mesh2);
    mesh2MergeEdgeAt(mesh2, vee2.vertex, -1);
    expectNoMesh2Errors(mesh2);

    const vee3 = mesh2SplitEdgeAt(mesh3, ee2.edge1, new Vector2(250, 250));
    expectNoMesh2Errors(mesh3);
    mesh2MergeEdgeAt(mesh3, vee3.vertex, -1);
    expectNoMesh2Errors(mesh3);

    const vee4 = mesh2SplitEdgeAt(mesh4, ee2.edge2, new Vector2(250, 250));
    expectNoMesh2Errors(mesh4);
    mesh2MergeEdgeAt(mesh4, vee4.vertex, -1);
    expectNoMesh2Errors(mesh4);

    const vee5 = mesh2SplitEdgeAt(mesh5, ee3.edge1, new Vector2(100, 250));
    expectNoMesh2Errors(mesh5);
    mesh2MergeEdgeAt(mesh5, vee5.vertex, -1);
    expectNoMesh2Errors(mesh5);

    const vee6 = mesh2SplitEdgeAt(mesh6, ee3.edge2, new Vector2(100, 250));
    expectNoMesh2Errors(mesh6);
    mesh2MergeEdgeAt(mesh6, vee6.vertex, -1);
    expectNoMesh2Errors(mesh6);
});
