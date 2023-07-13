import { Path2 } from "../../redgeometry/src/core/path.js";
import type { Box2 } from "../../redgeometry/src/primitives/box.js";
import { ColorRgba } from "../../redgeometry/src/primitives/color.js";
import { Edge2 } from "../../redgeometry/src/primitives/edge.js";
import { Point2 } from "../../redgeometry/src/primitives/point.js";
import { Polygon2 } from "../../redgeometry/src/primitives/polygon.js";
import type { Interval } from "../../redgeometry/src/utility/interval.js";
import type { Random } from "../../redgeometry/src/utility/random.js";

export type RandomRoofOptions = {
    dangerousAreaCount: Interval;
    objectHeight: Interval;
    objectWidth: Interval;
    obstacleCount: Interval;
    roofHeight: Interval;
    roofPointCount: Interval;
    roofDiscardProbability: Interval;
    roofBox: Box2;
};

export function createPath(random: Random, generator: number, count: number, width: number, height: number): Path2 {
    const path = new Path2();

    path.moveTo(new Point2(width * random.nextFloat(), height * random.nextFloat()));

    switch (generator) {
        case 0: {
            for (let i = 0; i < count; i++) {
                const p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                path.lineTo(p1);
            }
            break;
        }
        case 1: {
            for (let i = 0; i < count; i++) {
                const p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                const p2 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                path.quadTo(p1, p2);
            }
            break;
        }
        case 2: {
            for (let i = 0; i < count; i++) {
                const p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                const p2 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                const p3 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                path.cubicTo(p1, p2, p3);
            }
            break;
        }
        case 3: {
            for (let i = 0; i < count; i++) {
                const p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                const p2 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                path.conicTo(p1, p2, 4 * random.nextFloat());
            }
            break;
        }
    }

    return path;
}

export function createPolygonPair(
    random: Random,
    generator: number,
    offset: number,
    width: number,
    height: number,
): [Polygon2, Polygon2] {
    const polygonA = new Polygon2();
    const polygonB = new Polygon2();

    switch (generator) {
        case 0: {
            // Generation constants
            const from = 3;
            const to = 50;

            const count1 = random.nextIntBetween(from, to);
            const count2 = random.nextIntBetween(from, to);

            for (let i = 0; i < count1; i++) {
                polygonA.addPoint(new Point2(width * random.nextFloat(), height * random.nextFloat()));
            }

            for (let i = 0; i < count2; i++) {
                polygonB.addPoint(new Point2(width * random.nextFloat() + offset, height * random.nextFloat()));
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

export function createSimplePolygon(
    random: Random,
    box: Box2,
    count: number,
    irregularity: number,
    roundness: number,
): Polygon2 {
    const result = new Polygon2();

    const center = box.getCenter();
    const angleStep = (2 * Math.PI) / count;

    const w = 0.5 * box.dx;
    const h = 0.5 * box.dy;

    for (let i = 0; i < count; i++) {
        const a = i * angleStep + angleStep * random.nextFloatBetween(0, irregularity);
        const r = random.nextFloatBetween(roundness, 1);
        const x = w * r * Math.sin(a);
        const y = h * r * Math.cos(a);

        result.addXY(center.x + x, center.y + y);
    }

    return result;
}

export function createEdge(random: Random, box: Box2): Edge2 {
    const p0 = nextPointFromBox(random, box);
    const p1 = nextPointFromBox(random, box);

    return new Edge2(p0, p1);
}

export function createRandomColor(random: Random, s: number, v: number, a: number): ColorRgba {
    return ColorRgba.fromHsv(random.nextFloat(), s, v, a);
}

export function createRandomSeed(): number {
    return (0xffffff * Math.random()) | 0;
}

export function nextFloatBetweenInterval(random: Random, i: Interval): number {
    return random.nextFloatBetween(i.a, i.b);
}

export function nextIntBetweenInterval(random: Random, i: Interval): number {
    return random.nextIntBetween(i.a, i.b);
}

export function nextPointFromBox(random: Random, box: Box2): Point2 {
    const x = random.nextFloatBetween(box.x0, box.x1);
    const y = random.nextFloatBetween(box.y0, box.y1);

    return new Point2(x, y);
}

export function nextPointTupleFromBox(random: Random, box: Box2): [number, number] {
    const x = random.nextFloatBetween(box.x0, box.x1);
    const y = random.nextFloatBetween(box.y0, box.y1);

    return [x, y];
}
