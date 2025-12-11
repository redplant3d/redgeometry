import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { BooleanOperator, JoinType, PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { Polygon2 } from "redgeometry/src/core/polygon";
import { WindingOperator, type CustomWindingOperator } from "redgeometry/src/core/winding";
import type { ReadonlyMinMaxBox2 } from "redgeometry/src/primitives/box";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { Vector2 } from "redgeometry/src/primitives/vector";
import type { Random } from "redgeometry/src/utility/random";
import { ColorRgba } from "./color.ts";

export function createRandomColor(random: Random, s: number, v: number, a: number): ColorRgba {
    return ColorRgba.fromHSV(random.nextFloat(), s, v, a);
}

export function createRandomEdge(random: Random, box: ReadonlyMinMaxBox2): Edge2 {
    const p0 = createRandomPoint(random, box);
    const p1 = createRandomPoint(random, box);

    return new Edge2(p0, p1);
}

export function createRandomMesh(
    random: Random,
    generator: number,
    offset: number,
    width: number,
    height: number,
): Mesh2 {
    const [polygonA, polygonB] = createRandomPolygonPair(random, generator, offset, width, height);

    const clip = new PathClip2(PATH_QUALITY_OPTIONS_DEFAULT);

    for (const edge of polygonA.toEdges()) {
        clip.addEdge(edge, 0);
    }

    for (const edge of polygonB.toEdges()) {
        clip.addEdge(edge, 1);
    }

    const mesh = Mesh2.createEmpty();
    clip.process(mesh, {
        booleanOperator: BooleanOperator.EXCLUSION,
        windingOperatorA: WindingOperator.NON_ZERO,
        windingOperatorB: WindingOperator.NON_ZERO,
    });

    return mesh;
}

export function createRandomPath(
    random: Random,
    generator: number,
    count: number,
    width: number,
    height: number,
): Path2 {
    const path = Path2.createEmpty();

    path.moveTo(new Vector2(width * random.nextFloat(), height * random.nextFloat()));

    switch (generator) {
        case 0: {
            for (let i = 0; i < count; i++) {
                const p1 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                path.lineTo(p1);
            }
            break;
        }
        case 1: {
            for (let i = 0; i < count; i++) {
                const p1 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                const p2 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                path.quadTo(p1, p2);
            }
            break;
        }
        case 2: {
            for (let i = 0; i < count; i++) {
                const p1 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                const p2 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                const p3 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                path.cubicTo(p1, p2, p3);
            }
            break;
        }
        case 3: {
            for (let i = 0; i < count; i++) {
                const p1 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                const p2 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                path.conicTo(p1, p2, 4 * random.nextFloat());
            }
            break;
        }
    }

    return path;
}

export function createRandomPoint(random: Random, box: ReadonlyMinMaxBox2): Vector2 {
    const x = random.nextFloatBetween(box.minX, box.maxX);
    const y = random.nextFloatBetween(box.minY, box.maxY);

    return new Vector2(x, y);
}

export function createRandomPolygonPair(
    random: Random,
    generator: number,
    offset: number,
    width: number,
    height: number,
): [Polygon2, Polygon2] {
    const polygonA = Polygon2.createEmpty();
    const polygonB = Polygon2.createEmpty();

    switch (generator) {
        case 0: {
            // Generation constants
            const from = 3;
            const to = 50;

            const count1 = random.nextIntBetween(from, to);
            const count2 = random.nextIntBetween(from, to);

            for (let i = 0; i < count1; i++) {
                polygonA.addXY(width * random.nextFloat(), height * random.nextFloat());
            }

            for (let i = 0; i < count2; i++) {
                polygonB.addXY(width * random.nextFloat() + offset, height * random.nextFloat());
            }

            break;
        }
        case 1: {
            polygonA.addXY(100, 100);
            polygonA.addXY(400, 150);
            polygonA.addXY(450, 400);
            polygonA.addXY(150, 450);

            polygonB.addXY(300 + offset, 300);
            polygonB.addXY(600 + offset, 350);
            polygonB.addXY(650 + offset, 600);
            polygonB.addXY(350 + offset, 650);

            break;
        }
        case 2: {
            polygonA.addXY(100, 100);
            polygonA.addXY(400, 100);
            polygonA.addXY(400, 400);
            polygonA.addXY(100, 400);

            polygonB.addXY(200 + offset, 150);
            polygonB.addXY(300 + offset, 150);
            polygonB.addXY(300 + offset, 350);
            polygonB.addXY(200 + offset, 350);

            break;
        }
        case 3: {
            polygonA.addXY(100, 100);
            polygonA.addXY(150, 500);
            polygonA.addXY(550, 500);
            polygonA.addXY(500, 100);

            polygonB.addXY(250 + offset, 200);
            polygonB.addXY(450 + offset, 200);
            polygonB.addXY(400 + offset, 400);
            polygonB.addXY(200 + offset, 400);

            break;
        }
        case 4: {
            polygonA.addXY(100, 100);
            polygonA.addXY(400, 100);
            polygonA.addXY(400, 400);
            polygonA.addXY(100, 400);

            polygonB.addXY(150, 150 + offset);
            polygonB.addXY(350, 350 + offset);
            polygonB.addXY(350, 150 + offset);
            polygonB.addXY(150, 350 + offset);

            break;
        }
        case 5: {
            polygonA.addXY(100, 300);
            polygonA.addXY(200, 250);
            polygonA.addXY(300, 200 + 0.1 * offset);
            polygonA.addXY(400, 150);
            polygonA.addXY(510, 100);
            polygonA.addXY(505, 300);

            break;
        }
        case 6: {
            polygonA.addXY(100, 100);
            polygonA.addXY(600, 400);
            polygonA.addXY(200, 400);
            polygonA.addXY(300, 200);
            polygonA.addXY(400, 300);
            polygonA.addXY(500, 100);

            break;
        }
    }

    return [polygonA, polygonB];
}

export function createRandomPolygonSimple(
    random: Random,
    box: ReadonlyMinMaxBox2,
    count: number,
    irregularity: number,
    roundness: number,
): Polygon2 {
    const result = Polygon2.createEmpty();

    const center = box.center();
    const angleStep = (2 * Math.PI) / count;

    const w = 0.5 * box.sizeX();
    const h = 0.5 * box.sizeY();

    for (let i = 0; i < count; i++) {
        const a = i * angleStep + angleStep * random.nextFloatBetween(0, irregularity);
        const r = random.nextFloatBetween(roundness, 1);
        const x = w * r * Math.sin(a);
        const y = h * r * Math.cos(a);

        result.addXY(center.x + x, center.y + y);
    }

    return result;
}

export function createRandomSeed(): number {
    return (0xffffff * Math.random()) | 0;
}

export function getBooleanOperator(value: string): BooleanOperator {
    switch (value) {
        case "intersection":
            return BooleanOperator.INTERSECTION;
        case "exclusion":
            return BooleanOperator.EXCLUSION;
        case "awithoutb":
            return BooleanOperator.A_WITHOUT_B;
        case "bwithouta":
            return BooleanOperator.B_WITHOUT_A;
        default:
            return BooleanOperator.UNION;
    }
}

export function getJoinType(value: string): JoinType {
    switch (value) {
        case "miter":
            return JoinType.MITER;
        case "miterclip":
            return JoinType.MITER_CLIP;
        case "round":
            return JoinType.ROUND;
        default:
            return JoinType.BEVEL;
    }
}

export function getWindingOperator(value: string): WindingOperator | CustomWindingOperator {
    switch (value) {
        case "evenodd":
            return WindingOperator.EVEN_ODD;
        case "positive":
            return WindingOperator.POSITIVE;
        case "negative":
            return WindingOperator.NEGATIVE;
        case "absgeqtwo":
            return (wind: number) => Math.abs(wind) > 2;
        default:
            return WindingOperator.NON_ZERO;
    }
}
