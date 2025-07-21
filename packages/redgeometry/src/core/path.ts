import { copyCommandsReversed } from "../internal/path.js";
import {
    Bezier1Curve2,
    Bezier2Curve2,
    Bezier3Curve2,
    BezierRCurve2,
    type BezierCurve2,
    type ReadonlyBezierCurve2,
} from "../primitives/bezier.js";
import { MinMaxBox2 } from "../primitives/box.js";
import { Matrix3A, type ReadonlyMatrix3, type ReadonlyMatrix3A } from "../primitives/matrix.js";
import { Vector2, type ReadonlyVector2, type Vector2Like } from "../primitives/vector.js";
import { copyArray, copyArrayReversed } from "../utility/array.js";
import { assertUnreachable } from "../utility/debug.js";
import type { Enum } from "../utility/types.js";
import { Mesh2 } from "./mesh.js";
import { PathClip2 } from "./path-clip.js";
import {
    createPathDash,
    createPathFlatten,
    createPathOffset,
    createPathSimplify,
    createPathStroke,
    PATH_CLIP_OPTIONS_DEFAULT,
    PATH_DASH_OPTIONS_DEFAULT,
    PATH_OFFSET_OPTIONS_DEFAULT,
    PATH_QUALITY_OPTIONS_DEFAULT,
    PATH_STROKE_OPTIONS_DEFAULT,
    type PathClipOptions,
    type PathDashOptions,
    type PathOffsetOptions,
    type PathQualityOptions,
    type PathStrokeOptions,
} from "./path-options.js";
import { Polygon2 } from "./polygon.js";
import { isWindingInside, type CustomWindingOperator, type WindingOperator } from "./winding.js";

export interface PathSink2 {
    close(): void;
    conicTo(p1: ReadonlyVector2, p2: ReadonlyVector2, w: number): void;
    cubicTo(p1: ReadonlyVector2, p2: ReadonlyVector2, p3: ReadonlyVector2): void;
    lineTo(p1: ReadonlyVector2): void;
    moveTo(p0: ReadonlyVector2): void;
    quadTo(p1: ReadonlyVector2, p2: ReadonlyVector2): void;
}

export const PathCommandType = {
    MOVE: 0,
    LINEAR: 1,
    QUADRATIC: 2,
    CUBIC: 3,
    CONIC: 4,
    CLOSE: 5,
} as const;
export type PathCommandType = Enum<typeof PathCommandType>;

export type Path2Like = {
    readonly points: Vector2Like[];
    readonly commands: PathCommand[];
};

export type PathCommandMove = { type: typeof PathCommandType.MOVE };
export type PathCommandLine = { type: typeof PathCommandType.LINEAR };
export type PathCommandQuad = { type: typeof PathCommandType.QUADRATIC };
export type PathCommandCubic = { type: typeof PathCommandType.CUBIC };
export type PathCommandConic = { type: typeof PathCommandType.CONIC; w: number };
export type PathCommandClose = { type: typeof PathCommandType.CLOSE };

export type PathCommand =
    | PathCommandMove
    | PathCommandLine
    | PathCommandQuad
    | PathCommandCubic
    | PathCommandConic
    | PathCommandClose;

export class Path2 implements PathSink2 {
    private commands: PathCommand[];
    private points: ReadonlyVector2[];

    public constructor(commands: PathCommand[], points: ReadonlyVector2[]) {
        this.commands = commands;
        this.points = points;
    }

    public static createEmpty(): Path2 {
        return new Path2([], []);
    }

    public static fromObject(obj: Path2Like): Path2 {
        const commands = obj.commands.map((c) => ({ ...c }));
        const points = obj.points.map((p) => Vector2.fromObject(p));
        return new Path2(commands, points);
    }

    public static toObject(path: Path2): Path2Like {
        const commands = path.commands.map((c) => ({ ...c }));
        const points = path.points.map((p) => Vector2.toObject(p));
        return { commands, points };
    }

    public addArc(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2): void {
        this.moveTo(p0);
        this.arcTo(p1, p2);
    }

    public addCircle(p: ReadonlyVector2, r: number): void {
        this.addCircleXY(p.x, p.y, r);
    }

    public addCircleXY(x: number, y: number, r: number): void {
        this.moveToXY(x + r, y);
        this.arcToXY(x + r, y + r, x, y + r);
        this.arcToXY(x - r, y + r, x - r, y);
        this.arcToXY(x - r, y - r, x, y - r);
        this.arcToXY(x + r, y - r, x + r, y);
    }

    public addConic(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2, w: number): void {
        this.moveTo(p0);
        this.conicTo(p1, p2, w);
    }

    public addCubic(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2, p3: ReadonlyVector2): void {
        this.moveTo(p0);
        this.cubicTo(p1, p2, p3);
    }

    public addCurveSplines(...curves: ReadonlyBezierCurve2[]): void {
        if (curves.length === 0) {
            return;
        }

        this.moveTo(curves[0].p0);

        for (let i = 0; i < curves.length; i++) {
            const c = curves[i];

            switch (c.type) {
                case "bezier-1": {
                    this.lineTo(c.p1);
                    break;
                }
                case "bezier-2": {
                    this.quadTo(c.p1, c.p2);
                    break;
                }
                case "bezier-3": {
                    this.cubicTo(c.p1, c.p2, c.p3);
                    break;
                }
                case "bezier-r": {
                    this.conicTo(c.p1, c.p2, c.w);
                    break;
                }
                default: {
                    assertUnreachable(c);
                }
            }
        }
    }

    public addEllipse(p: ReadonlyVector2, rx: number, ry: number): void {
        this.addEllipseXY(p.x, p.y, rx, ry);
    }

    public addEllipseXY(x: number, y: number, rx: number, ry: number): void {
        this.moveToXY(x + rx, y);
        this.arcToXY(x + rx, y + ry, x, y + ry);
        this.arcToXY(x - rx, y + ry, x - rx, y);
        this.arcToXY(x - rx, y - ry, x, y - ry);
        this.arcToXY(x + rx, y - ry, x + rx, y);
        this.close();
    }

    public addLine(p0: ReadonlyVector2, p1: ReadonlyVector2): void {
        this.moveTo(p0);
        this.lineTo(p1);
    }

    public addLineXY(x0: number, y0: number, x1: number, y1: number): void {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);
        this.addLine(p0, p1);
    }

    public addPath(input: Path2, append = false): void {
        if (append && input.isValid()) {
            copyArray(input.commands, 1, this.commands, this.commands.length, input.commands.length - 1);
            copyArray(input.points, 1, this.points, this.points.length, input.points.length - 1);
        } else {
            copyArray(input.commands, 0, this.commands, this.commands.length, input.commands.length);
            copyArray(input.points, 0, this.points, this.points.length, input.points.length);
        }
    }

    public addPathReversed(input: Path2, append = false): void {
        if (append && input.isValid()) {
            copyCommandsReversed(input.commands, 1, this.commands, this.commands.length, input.commands.length - 1);
            copyArrayReversed(input.points, 0, this.points, this.points.length, input.points.length - 1);
        } else {
            copyCommandsReversed(input.commands, 0, this.commands, this.commands.length, input.commands.length);
            copyArrayReversed(input.points, 0, this.points, this.points.length, input.points.length);
        }
    }

    public addPie(pc: ReadonlyVector2, rx: number, ry: number, startAngle: number, sweepAngle: number): void {
        let a = sweepAngle;

        // Full circle is allowed
        if (Math.abs(a) > 2 * Math.PI) {
            // Basically this is the remainder
            a %= 2 * Math.PI;
        }

        let sin = Math.sin(startAngle);
        let cos = Math.cos(startAngle);

        const mat = Matrix3A.fromRotation(cos, sin);

        mat.setScale(mat, rx, ry);
        mat.setTranslate(mat, pc.x, pc.y);

        if (a < 0) {
            // Flip Y
            mat.setScalePre(mat, 1, -1);
        }

        a = Math.abs(a);

        sin = Math.sin(a);
        cos = Math.cos(a);

        let v1 = new Vector2(1, 0);
        let vc = new Vector2(1, 1);
        const v2 = new Vector2(cos, sin);

        this.moveTo(pc);

        this.lineTo(mat.mulV(v1));

        // Iteratively process 90 degree segments
        while (a > 0.5 * Math.PI + 0.005) {
            // TODO: Investigate correctness of `normal.neg`
            v1 = v1.normal().neg();

            const p1 = mat.mulV(vc);
            const p2 = mat.mulV(v1);
            this.arcTo(p1, p2);

            vc = vc.normal().neg();

            a -= 0.5 * Math.PI;
        }

        // Calculate the remaining control point
        vc = v1.add(v2);
        vc = vc.mulS(2).divS(vc.dot(vc));

        // This is actually half of the remaining cos. It is required that `v1 dot v2 > -1` holds
        // but we can safely assume it does (only critical for angles close to 180 degrees)
        cos = Math.sqrt(0.5 * v1.dot(v2) + 0.5);

        const p1 = mat.mulV(vc);
        const p2 = mat.mulV(v2);
        this.conicTo(p1, p2, cos);

        this.close();
    }

    public addPolygon(polygon: Polygon2): void {
        const points = polygon.points;

        if (points.length === 0) {
            return;
        }

        this.moveTo(points[0]);

        for (let i = 1; i < points.length; i++) {
            this.lineTo(points[i]);
        }

        this.close();
    }

    public addQuad(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2): void {
        this.moveTo(p0);
        this.quadTo(p1, p2);
    }

    public addRect(p0: ReadonlyVector2, p1: ReadonlyVector2): void {
        this.addRectXY(p0.x, p0.y, p1.x, p1.y);
    }

    public addRectXY(x0: number, y0: number, x1: number, y1: number): void {
        this.moveToXY(x0, y0);
        this.lineToXY(x1, y0);
        this.lineToXY(x1, y1);
        this.lineToXY(x0, y1);
        this.close();
    }

    public arcTo(p1: ReadonlyVector2, p2: ReadonlyVector2): void {
        this.conicTo(p1, p2, Math.SQRT1_2);
    }

    public arcToXY(x1: number, y1: number, x2: number, y2: number): void {
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);
        this.arcTo(p1, p2);
    }

    public bounds(): MinMaxBox2 {
        const bounds = MinMaxBox2.createEmpty();

        for (const c of this.toCurves()) {
            bounds.setUnion(bounds, c.bounds());
        }

        return bounds;
    }

    public centroid(): Vector2 | undefined {
        let x = 0;
        let y = 0;
        let area = 0;

        for (const c of this.toCurves()) {
            const a = c.signedArea();
            x += a * (c.p0.x + c.pn.x);
            y += a * (c.p0.y + c.pn.y);
            area += a;
        }

        if (area === 0) {
            return undefined;
        }

        area *= 3;

        return new Vector2(x / area, y / area);
    }

    public clear(): void {
        this.commands = [];
        this.points = [];
    }

    public clip(
        path: Path2,
        clipOptions?: Partial<PathClipOptions>,
        qualityOptions?: Partial<PathQualityOptions>,
    ): Path2 {
        const mesh = Mesh2.createEmpty();
        const pathClip = new PathClip2({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathClip.addPath(this, 0);
        pathClip.addPath(path, 1);
        pathClip.process(mesh, { ...PATH_CLIP_OPTIONS_DEFAULT, ...clipOptions });
        return mesh.getFacesPath();
    }

    public close(): void {
        this.commands.push({ type: PathCommandType.CLOSE });
    }

    public conicTo(p1: ReadonlyVector2, p2: ReadonlyVector2, w: number): void {
        this.commands.push({ type: PathCommandType.CONIC, w });
        this.points.push(p1);
        this.points.push(p2);
    }

    public conicToXY(x1: number, y1: number, x2: number, y2: number, w: number): void {
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);
        this.conicTo(p1, p2, w);
    }

    public copyFrom(path: Path2): void {
        this.commands = path.commands.slice();
        this.points = path.points.slice();
    }

    public cubicTo(p1: ReadonlyVector2, p2: ReadonlyVector2, p3: ReadonlyVector2): void {
        this.commands.push({ type: PathCommandType.CUBIC });
        this.points.push(p1);
        this.points.push(p2);
        this.points.push(p3);
    }

    public cubicToXY(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);
        const p3 = new Vector2(x3, y3);
        this.cubicTo(p1, p2, p3);
    }

    public dash(dashOptions?: Partial<PathDashOptions>, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = Path2.createEmpty();
        const pathDash = createPathDash({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathDash.process(this, output, { ...PATH_DASH_OPTIONS_DEFAULT, ...dashOptions });
        return output;
    }

    public firstCommand(): PathCommand | undefined {
        return this.commands[0];
    }

    public firstPoint(): ReadonlyVector2 | undefined {
        return this.points[0];
    }

    public flatten(forceClose = false, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = Path2.createEmpty();
        const pathFlatten = createPathFlatten({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathFlatten.process(this, output, forceClose);
        return output;
    }

    public getCommands(): readonly PathCommand[] {
        return this.commands;
    }

    public getPoints(): readonly ReadonlyVector2[] {
        return this.points;
    }

    public hasPointInside(p: ReadonlyVector2, windingOperator: WindingOperator | CustomWindingOperator): boolean {
        if (!this.isValid()) {
            return false;
        }

        let wind = 0;

        for (const c of this.toCurves()) {
            const bounds = c.controlBounds();

            // Quickly reject curves by their control bounds
            if (p.y < bounds.minY || p.y > bounds.maxY || p.x < bounds.minX) {
                continue;
            }

            wind += c.windingAt(p);
        }

        return isWindingInside(wind, windingOperator);
    }

    public hasPointInsideFrac(
        p: ReadonlyVector2,
        windingOperator: WindingOperator | CustomWindingOperator,
        stepSize?: number,
    ): boolean {
        if (!this.isValid()) {
            return false;
        }

        const step = stepSize ?? 2 ** -8;

        let wind = 0;

        for (const c of this.toCurves()) {
            wind += c.windingAtFrac(p, step);
        }

        // TODO: Improve snapping
        wind = wind / (2 * Math.PI);
        wind = Math.round(wind);

        return isWindingInside(wind, windingOperator);
    }

    public isClosed(): boolean {
        return this.lastCommand()?.type === PathCommandType.CLOSE;
    }

    public isValid(): boolean {
        return this.firstCommand()?.type === PathCommandType.MOVE;
    }

    public lastCommand(): PathCommand | undefined {
        return this.commands[this.commands.length - 1];
    }

    public lastPoint(): ReadonlyVector2 | undefined {
        return this.points[this.points.length - 1];
    }

    public lineTo(p1: ReadonlyVector2): void {
        this.commands.push({ type: PathCommandType.LINEAR });
        this.points.push(p1);
    }

    public lineToXY(x1: number, y1: number): void {
        const p1 = new Vector2(x1, y1);
        this.lineTo(p1);
    }

    public moveTo(p0: ReadonlyVector2): void {
        this.commands.push({ type: PathCommandType.MOVE });
        this.points.push(p0);
    }

    public moveToXY(x0: number, y0: number): void {
        const p0 = new Vector2(x0, y0);
        this.moveTo(p0);
    }

    public offset(offsetOptions?: Partial<PathOffsetOptions>, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = Path2.createEmpty();
        const pathOffset = createPathOffset({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathOffset.process(this, output, { ...PATH_OFFSET_OPTIONS_DEFAULT, ...offsetOptions });
        return output;
    }

    public quadTo(p1: ReadonlyVector2, p2: ReadonlyVector2): void {
        this.commands.push({ type: PathCommandType.QUADRATIC });
        this.points.push(p1);
        this.points.push(p2);
    }

    public quadToXY(x1: number, y1: number, x2: number, y2: number): void {
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);
        this.quadTo(p1, p2);
    }

    public signedArea(): number {
        let area = 0;

        for (const c of this.toCurves()) {
            area += c.signedArea();
        }

        return area;
    }

    public simplify(qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = Path2.createEmpty();
        const pathSimplify = createPathSimplify({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathSimplify.process(this, output);
        return output;
    }

    public stroke(strokeOptions?: Partial<PathStrokeOptions>, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = Path2.createEmpty();
        const pathStroke = createPathStroke({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathStroke.process(this, output, { ...PATH_STROKE_OPTIONS_DEFAULT, ...strokeOptions });
        return output;
    }

    public svgArcTo(
        p1: ReadonlyVector2,
        rx: number,
        ry: number,
        xAxisRotation: number,
        largeArc: boolean,
        sweep: boolean,
    ): void {
        const p0 = this.lastPoint();

        // Special cases (see https://www.w3.org/TR/SVG/paths.html#ArcOutOfRangeParameters)
        if (p0 === undefined || p0 === p1 || rx === 0 || ry === 0) {
            this.lineTo(p1);

            return;
        }

        // Calculate sin/cos for reuse
        let sin = Math.sin(xAxisRotation);
        let cos = Math.cos(xAxisRotation);

        // Inverse rotation to align the ellipse
        const mat = Matrix3A.fromRotation(cos, -sin);

        // Vector from center (transformed midpoint)
        let v = p0.sub(p1).mulS(0.5);

        v = mat.mulV(v);

        // Radii (see https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii)
        let sx = Math.abs(rx);
        let sy = Math.abs(ry);

        // If scale > 1 the ellipse will need to be rescaled
        let scale = (v.x * v.x) / (sx * sx) + (v.y * v.y) / (sy * sy);

        if (scale > 1) {
            scale = Math.sqrt(scale);

            sx *= scale;
            sy *= scale;
        }

        // Prepend scale
        mat.setScale(mat, 1 / sx, 1 / sy);

        // Calculate unit coordinates
        let pp0: ReadonlyVector2 = mat.transformPoint(p0);
        let pp1: ReadonlyVector2 = mat.transformPoint(p1);

        // New vector from center (unit midpoint)
        v = pp1.sub(pp0).mulS(0.5);

        let pc = pp0.add(v);

        // If `lenght^2 >= 1` the point is already the center
        const len2 = v.lengthSq();

        if (len2 < 1) {
            const f = Math.sqrt(1 / len2 - 1);

            // TODO: Investigate correctness of `normal.neg`
            v = v.normal().neg().mulS(f);

            if (largeArc !== sweep) {
                pc = pc.add(v);
            } else {
                pc = pc.sub(v);
            }
        }

        // Both vectors are unit vectors
        let v1 = pp0.sub(pc);
        let v2 = pp1.sub(pc);

        // Set up the final transformation matrix
        mat.setFromRotation(v1.x, v1.y);
        mat.setTranslate(mat, pc.x, pc.y);
        mat.setScale(mat, sx, sy);
        mat.setRotate(mat, cos, sin);

        // We have `sin = v1.cross(v2) / (v1.length * v2.length)`
        // with the length of `v1` and `v2` both 1 (unit vectors)
        sin = v1.cross(v2);

        // Accordingly `cos = v1.dot(v2) / (v1.length * v2.length)`
        // to get the angle between `v1` and `v2`
        cos = v1.dot(v2);

        // So the sweep angle is `atan2(y, x) = atan2(sin, cos)`
        // https://stackoverflow.com/a/16544330
        let sweepAngle = Math.atan2(sin, cos);

        if (sweep) {
            // Correct the angle if necessary
            if (sweepAngle < 0) {
                sweepAngle += 2 * Math.PI;
            }

            // | v1.X   v1.Y  0 |   | v2.X |   | v1.X * v2.X + v1.Y * v2.Y  |
            // | -v1.Y  v1.X  0 | * | v2.Y | = | v1.X * v2.Y - v1.Y * v2.X  |
            // |  0     0     1 |   | 1    |   | 1                          |
            v2 = new Vector2(cos, sin);
        } else {
            if (sweepAngle > 0) {
                sweepAngle -= 2 * Math.PI;
            }

            // Flip Y
            mat.setScalePre(mat, 1, -1);

            v2 = new Vector2(cos, -sin);

            sweepAngle = Math.abs(sweepAngle);
        }

        // First quadrant (start and control point)
        v1 = new Vector2(1, 0);
        v = new Vector2(1, 1);

        // Iteratively process 90 degree segments
        while (sweepAngle > 0.5 * Math.PI + 0.005) {
            // TODO: Investigate correctness of `normal.neg`
            v1 = v1.normal().neg();

            // Transformed points of the arc segment
            pp0 = mat.mulV(v);
            pp1 = mat.mulV(v1);

            this.arcTo(pp0, pp1);

            v = v.normal().neg();

            sweepAngle -= 0.5 * Math.PI;
        }

        // Calculate the remaining control point
        v = v1.add(v2);
        v = v.mulS(2).divS(v.dot(v));

        // Final arc segment
        pp0 = mat.mulV(v);
        pp1 = p1;

        // This is actually half of the remaining cos. It is required that `v1 dot v2 > -1` holds
        // but we can safely assume it does (only critical for angles close to 180 degrees)
        cos = Math.sqrt(0.5 * (1 + v1.dot(v2)));

        this.conicTo(pp0, pp1, cos);
    }

    public toCurves(): BezierCurve2[] {
        const curves: BezierCurve2[] = [];

        const commands = this.commands;
        const points = this.points;

        let cIdx = 0;
        let pIdx = 0;

        let ps = Vector2.ZERO;
        let p0 = Vector2.ZERO;

        while (cIdx < commands.length) {
            const command = commands[cIdx];
            cIdx += 1;

            switch (command.type) {
                case 0 /* MOVE */: {
                    ps = points[pIdx];
                    p0 = ps;
                    pIdx += 1;
                    break;
                }
                case 1 /* LINEAR */: {
                    const p1 = points[pIdx];
                    const c = new Bezier1Curve2(p0, p1);
                    curves.push(c);
                    p0 = p1;
                    pIdx += 1;
                    break;
                }
                case 2 /* QUADRATIC */: {
                    const p1 = points[pIdx];
                    const p2 = points[pIdx + 1];
                    const c = new Bezier2Curve2(p0, p1, p2);
                    curves.push(c);
                    p0 = p2;
                    pIdx += 2;
                    break;
                }
                case 3 /* CUBIC */: {
                    const p1 = points[pIdx];
                    const p2 = points[pIdx + 1];
                    const p3 = points[pIdx + 2];
                    const c = new Bezier3Curve2(p0, p1, p2, p3);
                    curves.push(c);
                    p0 = p3;
                    pIdx += 3;
                    break;
                }
                case 4 /* CONIC */: {
                    const p1 = points[pIdx];
                    const p2 = points[pIdx + 1];
                    const c = new BezierRCurve2(p0, p1, p2, command.w);
                    curves.push(c);
                    p0 = p2;
                    pIdx += 2;
                    break;
                }
                case 5 /* CLOSE */: {
                    if (!p0.eq(ps)) {
                        const c = new Bezier1Curve2(p0, ps);
                        curves.push(c);
                        p0 = ps;
                    }
                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        return curves;
    }

    public toMesh(
        winding: WindingOperator | CustomWindingOperator,
        qualityOptions?: Partial<PathQualityOptions>,
    ): Mesh2 {
        const mesh = Mesh2.createEmpty();
        const pathClip = new PathClip2({ ...PATH_QUALITY_OPTIONS_DEFAULT, ...qualityOptions });
        pathClip.addPath(this, 0);
        pathClip.process(mesh, { ...PATH_CLIP_OPTIONS_DEFAULT, windingOperatorA: winding });
        return mesh;
    }

    public toMultiPolygon(
        winding: WindingOperator | CustomWindingOperator,
        qualityOptions?: Partial<PathQualityOptions>,
    ): Polygon2[] {
        const mesh = this.toMesh(winding, qualityOptions);
        return mesh.getFaces().map((f) => new Polygon2(f.getPoints()));
    }

    public toSvgData(): string {
        const commands = this.getCommands();
        const points = this.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let svgData = "";

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case 0 /* MOVE */: {
                    const p0 = points[pIdx++];
                    svgData += "M" + p0.x + " " + p0.y;

                    break;
                }
                case 1 /* LINEAR */: {
                    const p1 = points[pIdx++];
                    svgData += "L" + p1.x + " " + p1.y;

                    break;
                }
                case 2 /* QUADRATIC */: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    svgData += "Q" + p1.x + " " + p1.y + " " + p2.x + " " + p2.y;

                    break;
                }
                case 3 /* CUBIC */: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    const p3 = points[pIdx++];
                    svgData += "C" + p1.x + " " + p1.y + " " + p2.x + " " + p2.y + " " + p3.x + " " + p3.y;

                    break;
                }
                case 4 /* CONIC */: {
                    // Workaround (conics not supported by HTML canvas)
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    svgData += "L" + p1.x + " " + p1.y + " L" + p2.x + " " + p2.y;

                    break;
                }
                case 5 /* CLOSE */: {
                    svgData += "Z";

                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        return svgData;
    }

    public transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): void {
        const points = this.points;
        for (let i = 0; i < points.length; i++) {
            points[i] = mat.transformPoint(points[i]);
        }
    }
}
