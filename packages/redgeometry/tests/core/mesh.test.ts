import { expect, test } from "vitest";
import { MeshEdge2 } from "../../src/core/mesh.js";
import { Bezier1Curve2 } from "../../src/primitives/bezier.js";

test("Mesh2 - splice", () => {
    const c1 = Bezier1Curve2.fromXY(0, 0, 0, 100);
    const c2 = Bezier1Curve2.fromXY(0, 0, 100, 0);
    const e1 = MeshEdge2.createPair(c1);
    const e2 = MeshEdge2.createPair(c2);

    // Initial conditions
    expect(e1.lnext).toEqual(e1.sym);
    expect(e1.onext).toEqual(e1);
    expect(e1.sym.lnext).toEqual(e1);
    expect(e1.sym.onext).toEqual(e1.sym);

    expect(e2.lnext).toEqual(e2.sym);
    expect(e2.onext).toEqual(e2);
    expect(e2.sym.lnext).toEqual(e2);
    expect(e2.sym.onext).toEqual(e2.sym);

    MeshEdge2.splice(e1, e2);

    // After first splice
    expect(e1.lnext).toEqual(e1.sym);
    expect(e1.onext).toEqual(e2);
    expect(e1.sym.lnext).toEqual(e2);
    expect(e1.sym.onext).toEqual(e1.sym);

    expect(e2.lnext).toEqual(e2.sym);
    expect(e2.onext).toEqual(e1);
    expect(e2.sym.lnext).toEqual(e1);
    expect(e2.sym.onext).toEqual(e2.sym);

    MeshEdge2.splice(e1, e2);

    // After second splice (initial conditions again)
    expect(e1.lnext).toEqual(e1.sym);
    expect(e1.onext).toEqual(e1);
    expect(e1.sym.lnext).toEqual(e1);
    expect(e1.sym.onext).toEqual(e1.sym);

    expect(e2.lnext).toEqual(e2.sym);
    expect(e2.onext).toEqual(e2);
    expect(e2.sym.lnext).toEqual(e2);
    expect(e2.sym.onext).toEqual(e2.sym);
});
