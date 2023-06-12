import { Path2CurveIterator } from "../internal/iterator.js";
import { copyCommandsReversed, isWindingInside } from "../internal/path.js";
import { CurveType, type BezierCurve2 } from "../primitives/bezier.js";
import { Box2 } from "../primitives/box.js";
import { Matrix3x2, Matrix3x3 } from "../primitives/matrix.js";
import { Point2 } from "../primitives/point.js";
import { Polygon2 } from "../primitives/polygon.js";
import { Vector2 } from "../primitives/vector.js";
import { copyArray, copyArrayReversed } from "../utility/array.js";
import { assertUnreachable } from "../utility/debug.js";
import { Mesh2 } from "./mesh.js";
import { PathClip2 } from "./path-clip.js";
import {
    DEFAULT_PATH_CLIP_OPTIONS,
    DEFAULT_PATH_DASH_OPTIONS,
    DEFAULT_PATH_OFFSET_OPTIONS,
    DEFAULT_PATH_QUALITY_OPTIONS,
    DEFAULT_PATH_STROKE_OPTIONS,
    WindingOperator,
    createPathDash,
    createPathFlatten,
    createPathOffset,
    createPathSimplify,
    createPathStroke,
    type CustomWindingOperator,
    type PathClipOptions,
    type PathDashOptions,
    type PathOffsetOptions,
    type PathQualityOptions,
    type PathStrokeOptions,
} from "./path-options.js";

export interface PathSink2 {
    close(): void;
    conicTo(p1: Point2, p2: Point2, w: number): void;
    cubicTo(p1: Point2, p2: Point2, p3: Point2): void;
    lineTo(p1: Point2): void;
    moveTo(p0: Point2): void;
    quadTo(p1: Point2, p2: Point2): void;
}

export enum PathCommandType {
    Move,
    Linear,
    Quadratic,
    Cubic,
    Conic,
    Close,
}

export type PathCommandMove = { type: PathCommandType.Move };
export type PathCommandLine = { type: PathCommandType.Linear };
export type PathCommandQuad = { type: PathCommandType.Quadratic };
export type PathCommandCubic = { type: PathCommandType.Cubic };
export type PathCommandConic = { type: PathCommandType.Conic; w: number };
export type PathCommandClose = { type: PathCommandType.Close };

export type PathCommand =
    | PathCommandMove
    | PathCommandLine
    | PathCommandQuad
    | PathCommandCubic
    | PathCommandConic
    | PathCommandClose;

export class Path2 implements PathSink2 {
    private commands: PathCommand[];
    private points: Point2[];

    constructor() {
        this.commands = [];
        this.points = [];
    }

    public addArc(p0: Point2, p1: Point2, p2: Point2): void {
        this.moveTo(p0);
        this.arcTo(p1, p2);
    }

    public addCircle(p: Point2, r: number): void {
        this.addCircleXY(p.x, p.y, r);
    }

    public addCircleXY(x: number, y: number, r: number): void {
        this.moveToXY(x + r, y);
        this.arcToXY(x + r, y + r, x, y + r);
        this.arcToXY(x - r, y + r, x - r, y);
        this.arcToXY(x - r, y - r, x, y - r);
        this.arcToXY(x + r, y - r, x + r, y);
    }

    public addConic(p0: Point2, p1: Point2, p2: Point2, w: number): void {
        this.moveTo(p0);
        this.conicTo(p1, p2, w);
    }

    public addCubic(p0: Point2, p1: Point2, p2: Point2, p3: Point2): void {
        this.moveTo(p0);
        this.cubicTo(p1, p2, p3);
    }

    public addCurveSplines(...curves: BezierCurve2[]): void {
        if (curves.length === 0) {
            return;
        }

        this.moveTo(curves[0].p0);

        for (let i = 0; i < curves.length; i++) {
            const c = curves[i];

            switch (c.type) {
                case CurveType.Bezier1: {
                    this.lineTo(c.p1);
                    break;
                }
                case CurveType.Bezier2: {
                    this.quadTo(c.p1, c.p2);
                    break;
                }
                case CurveType.Bezier3: {
                    this.cubicTo(c.p1, c.p2, c.p3);
                    break;
                }
                case CurveType.BezierR: {
                    this.conicTo(c.p1, c.p2, c.w);
                    break;
                }
                default: {
                    assertUnreachable(c);
                }
            }
        }
    }

    public addEllipse(p: Point2, rx: number, ry: number): void {
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

    public addLine(p0: Point2, p1: Point2): void {
        this.moveTo(p0);
        this.lineTo(p1);
    }

    public addLineXY(x0: number, y0: number, x1: number, y1: number): void {
        const p0 = new Point2(x0, y0);
        const p1 = new Point2(x1, y1);
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

    public addPie(pc: Point2, rx: number, ry: number, startAngle: number, sweepAngle: number): void {
        // Full circle is allowed
        if (Math.abs(sweepAngle) > 2 * Math.PI) {
            // Basically this is the remainder
            sweepAngle %= 2 * Math.PI;
        }

        let sin = Math.sin(startAngle);
        let cos = Math.cos(startAngle);

        const mat = Matrix3x2.fromRotation(sin, cos);

        mat.scalePre(rx, ry);
        mat.translatePre(pc.x, pc.y);

        if (sweepAngle < 0) {
            // Flip Y
            mat.scalePost(1, -1);
        }

        sweepAngle = Math.abs(sweepAngle);

        sin = Math.sin(sweepAngle);
        cos = Math.cos(sweepAngle);

        let v1 = new Vector2(1, 0);
        let vc = new Vector2(1, 1);
        const v2 = new Vector2(cos, sin);

        this.moveTo(pc);

        this.lineTo(mat.mapVector(v1).toPoint());

        // Iteratively process 90 degree segments
        while (sweepAngle > 0.5 * Math.PI + 0.005) {
            // TODO: Investigate correctness of `normal.neg`
            v1 = v1.normal.neg;

            const p1 = mat.mapVector(vc).toPoint();
            const p2 = mat.mapVector(v1).toPoint();
            this.arcTo(p1, p2);

            vc = vc.normal.neg;

            sweepAngle -= 0.5 * Math.PI;
        }

        // Calculate the remaining control point
        vc = v1.add(v2);
        vc = vc.mul(2).div(vc.dot(vc));

        // This is actually half of the remaining cos. It is required that `v1 dot v2 > -1` holds
        // but we can safely assume it does (only critical for angles close to 180 degrees)
        cos = Math.sqrt(0.5 * v1.dot(v2) + 0.5);

        const p1 = mat.mapVector(vc).toPoint();
        const p2 = mat.mapVector(v2).toPoint();
        this.conicTo(p1, p2, cos);

        this.close();
    }

    public addQuad(p0: Point2, p1: Point2, p2: Point2): void {
        this.moveTo(p0);
        this.quadTo(p1, p2);
    }

    public addRect(p0: Point2, p1: Point2): void {
        this.addRectXY(p0.x, p0.y, p1.x, p1.y);
    }

    public addRectXY(x0: number, y0: number, x1: number, y1: number): void {
        this.moveToXY(x0, y0);
        this.lineToXY(x1, y0);
        this.lineToXY(x1, y1);
        this.lineToXY(x0, y1);
        this.close();
    }

    public arcTo(p1: Point2, p2: Point2): void {
        this.conicTo(p1, p2, 0.70710678118654757);
    }

    public arcToXY(x1: number, y1: number, x2: number, y2: number): void {
        const p1 = new Point2(x1, y1);
        const p2 = new Point2(x2, y2);
        this.arcTo(p1, p2);
    }

    public clear(): void {
        this.commands = [];
        this.points = [];
    }

    public clip(
        path: Path2,
        clipOptions?: Partial<PathClipOptions>,
        qualityOptions?: Partial<PathQualityOptions>
    ): Path2 {
        const mesh = new Mesh2();
        const pathClip = new PathClip2({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathClip.addPath(this, 0);
        pathClip.addPath(path, 1);
        pathClip.process(mesh, { ...DEFAULT_PATH_CLIP_OPTIONS, ...clipOptions });
        return mesh.getFacesPath();
    }

    public close(): void {
        this.commands.push({ type: PathCommandType.Close });
    }

    public conicTo(p1: Point2, p2: Point2, w: number): void {
        this.commands.push({ type: PathCommandType.Conic, w });
        this.points.push(p1);
        this.points.push(p2);
    }

    public conicToXY(x1: number, y1: number, x2: number, y2: number, w: number): void {
        const p1 = new Point2(x1, y1);
        const p2 = new Point2(x2, y2);
        this.conicTo(p1, p2, w);
    }

    public copyFrom(path: Path2): void {
        this.commands = path.commands.slice();
        this.points = path.points.slice();
    }

    public cubicTo(p1: Point2, p2: Point2, p3: Point2): void {
        this.commands.push({ type: PathCommandType.Cubic });
        this.points.push(p1);
        this.points.push(p2);
        this.points.push(p3);
    }

    public cubicToXY(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        const p1 = new Point2(x1, y1);
        const p2 = new Point2(x2, y2);
        const p3 = new Point2(x3, y3);
        this.cubicTo(p1, p2, p3);
    }

    public dash(dashOptions?: Partial<PathDashOptions>, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = new Path2();
        const pathDash = createPathDash({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathDash.process(this, output, { ...DEFAULT_PATH_DASH_OPTIONS, ...dashOptions });
        return output;
    }

    public flatten(forceClose = false, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = new Path2();
        const pathFlatten = createPathFlatten({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathFlatten.process(this, output, forceClose);
        return output;
    }

    public getBounds(): Box2 {
        const bounds = Box2.empty;

        for (const c of this.getCurveIterator()) {
            bounds.union(c.getBounds());
        }

        return bounds;
    }

    public getCommands(): readonly PathCommand[] {
        return this.commands;
    }

    public getCurveIterator(): Path2CurveIterator {
        return new Path2CurveIterator(this.commands, this.points);
    }

    public getFirstCommand(): PathCommand | undefined {
        return this.commands[0];
    }

    public getFirstPoint(): Point2 | undefined {
        return this.points[0];
    }

    public getLastCommand(): PathCommand | undefined {
        return this.commands[this.commands.length - 1];
    }

    public getLastPoint(): Point2 | undefined {
        return this.points[this.points.length - 1];
    }

    public getPoints(): readonly Point2[] {
        return this.points;
    }

    public getSignedArea(): number {
        let area = 0;

        for (const c of this.getCurveIterator()) {
            area += c.getSignedArea();
        }

        return area;
    }

    public getSvgData(): string {
        const commands = this.getCommands();
        const points = this.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let svgData = "";

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    const p0 = points[pIdx++];
                    svgData += `M${p0.x} ${p0.y}`;

                    break;
                }
                case PathCommandType.Linear: {
                    const p1 = points[pIdx++];
                    svgData += `L${p1.x} ${p1.y}`;

                    break;
                }
                case PathCommandType.Quadratic: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    svgData += `Q${p1.x} ${p1.y} ${p2.x} ${p2.y}`;

                    break;
                }
                case PathCommandType.Cubic: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    const p3 = points[pIdx++];
                    svgData += `C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;

                    break;
                }
                case PathCommandType.Conic: {
                    // Workaround (conics not supported by HTML canvas)
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    svgData += `L${p1.x} ${p1.y} L${p2.x} ${p2.y}`;

                    break;
                }
                case PathCommandType.Close: {
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

    public hasPointInside(p: Point2, windingOperator: WindingOperator | CustomWindingOperator): boolean {
        if (!this.isValid()) {
            return false;
        }

        let wind = 0;

        for (const c of this.getCurveIterator()) {
            const bounds = c.getControlBounds();

            // Quickly reject curves by their control bounds
            if (p.y < bounds.y0 || p.y > bounds.y1 || p.x < bounds.x0) {
                continue;
            }

            wind += c.getWindingAt(p);
        }

        return isWindingInside(wind, windingOperator);
    }

    public hasPointInsideFrac(
        p: Point2,
        windingOperator: WindingOperator | CustomWindingOperator,
        stepSize?: number
    ): boolean {
        if (!this.isValid()) {
            return false;
        }

        const step = stepSize ?? 2 ** -8;

        let wind = 0;

        for (const c of this.getCurveIterator()) {
            wind += c.getWindingFracAt(p, step);
        }

        // TODO: Improve snapping
        wind = wind / (2 * Math.PI);
        wind = Math.round(wind);

        return isWindingInside(wind, windingOperator);
    }

    public isClosed(): boolean {
        return this.getLastCommand()?.type === PathCommandType.Close;
    }

    public isValid(): boolean {
        return this.getFirstCommand()?.type === PathCommandType.Move;
    }

    public lineTo(p1: Point2): void {
        this.commands.push({ type: PathCommandType.Linear });
        this.points.push(p1);
    }

    public lineToXY(x1: number, y1: number): void {
        const p1 = new Point2(x1, y1);
        this.lineTo(p1);
    }

    public moveTo(p0: Point2): void {
        this.commands.push({ type: PathCommandType.Move });
        this.points.push(p0);
    }

    public moveToXY(x0: number, y0: number): void {
        const p0 = new Point2(x0, y0);
        this.moveTo(p0);
    }

    public offset(offsetOptions?: Partial<PathOffsetOptions>, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = new Path2();
        const pathOffset = createPathOffset({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathOffset.process(this, output, { ...DEFAULT_PATH_OFFSET_OPTIONS, ...offsetOptions });
        return output;
    }

    public quadTo(p1: Point2, p2: Point2): void {
        this.commands.push({ type: PathCommandType.Quadratic });
        this.points.push(p1);
        this.points.push(p2);
    }

    public quadToXY(x1: number, y1: number, x2: number, y2: number): void {
        const p1 = new Point2(x1, y1);
        const p2 = new Point2(x2, y2);
        this.quadTo(p1, p2);
    }

    public simplify(qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = new Path2();
        const pathSimplify = createPathSimplify({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathSimplify.process(this, output);
        return output;
    }

    public stroke(strokeOptions?: Partial<PathStrokeOptions>, qualityOptions?: Partial<PathQualityOptions>): Path2 {
        const output = new Path2();
        const pathStroke = createPathStroke({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathStroke.process(this, output, { ...DEFAULT_PATH_STROKE_OPTIONS, ...strokeOptions });
        return output;
    }

    public svgArcTo(
        p1: Point2,
        rx: number,
        ry: number,
        xAxisRotation: number,
        largeArc: boolean,
        sweep: boolean
    ): void {
        const p0 = this.getLastPoint();

        // Special cases (see https://www.w3.org/TR/SVG/paths.html#ArcOutOfRangeParameters)
        if (p0 === undefined || p0 === p1 || rx === 0 || ry === 0) {
            this.lineTo(p1);

            return;
        }

        // Calculate sin/cos for reuse
        let sin = Math.sin(xAxisRotation);
        let cos = Math.cos(xAxisRotation);

        // Inverse rotation to align the ellipse
        const mat = Matrix3x2.fromRotation(-sin, cos);

        // Vector from center (transformed midpoint)
        let v = p0.sub(p1).mul(0.5);

        v = mat.mapVector(v);

        // Radii (see https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii)
        rx = Math.abs(rx);
        ry = Math.abs(ry);

        // If scale > 1 the ellipse will need to be rescaled
        let scale = (v.x * v.x) / (rx * rx) + (v.y * v.y) / (ry * ry);

        if (scale > 1) {
            scale = Math.sqrt(scale);

            rx *= scale;
            ry *= scale;
        }

        // Prepend scale
        mat.scalePre(1 / rx, 1 / ry);

        // Calculate unit coordinates
        let pp0 = mat.mapPoint(p0);
        let pp1 = mat.mapPoint(p1);

        // New vector from center (unit midpoint)
        v = pp1.sub(pp0).mul(0.5);

        let pc = pp0.add(v);

        // If `lenght^2 >= 1` the point is already the center
        const len2 = v.lengthSq;

        if (len2 < 1) {
            // TODO: Investigate correctness of `normal.neg`
            v = v.normal.neg.mul(Math.sqrt(1 / len2 - 1));

            if (largeArc !== sweep) {
                pc = pc.add(v);
            } else {
                pc = pc.add(v.neg);
            }
        }

        // Both vectors are unit vectors
        let v1 = pp0.sub(pc);
        let v2 = pp1.sub(pc);

        // Set up the final transformation matrix
        mat.rotateSet(v1.y, v1.x);
        mat.translatePre(pc.x, pc.y);
        mat.scalePre(rx, ry);
        mat.rotatePre(sin, cos);

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
            mat.scalePost(1, -1);

            v2 = new Vector2(cos, -sin);

            sweepAngle = Math.abs(sweepAngle);
        }

        // First quadrant (start and control point)
        v1 = new Vector2(1, 0);
        v = new Vector2(1, 1);

        // Iteratively process 90 degree segments
        while (sweepAngle > 0.5 * Math.PI + 0.005) {
            // TODO: Investigate correctness of `normal.neg`
            v1 = v1.normal.neg;

            // Transformed points of the arc segment
            pp0 = mat.mapVector(v).toPoint();
            pp1 = mat.mapVector(v1).toPoint();

            this.arcTo(pp0, pp1);

            v = v.normal.neg;

            sweepAngle -= 0.5 * Math.PI;
        }

        // Calculate the remaining control point
        v = v1.add(v2);
        v = v.mul(2).div(v.dot(v));

        // Final arc segment
        pp0 = mat.mapVector(v).toPoint();
        pp1 = p1;

        // This is actually half of the remaining cos. It is required that `v1 dot v2 > -1` holds
        // but we can safely assume it does (only critical for angles close to 180 degrees)
        cos = Math.sqrt(0.5 * (1 + v1.dot(v2)));

        this.conicTo(pp0, pp1, cos);
    }

    public toMesh(
        winding: WindingOperator | CustomWindingOperator,
        qualityOptions?: Partial<PathQualityOptions>
    ): Mesh2 {
        const mesh = new Mesh2();
        const pathClip = new PathClip2({ ...DEFAULT_PATH_QUALITY_OPTIONS, ...qualityOptions });
        pathClip.addPath(this, 0);
        pathClip.process(mesh, { ...DEFAULT_PATH_CLIP_OPTIONS, windingOperatorA: winding });
        return mesh;
    }

    public toMultiPolygon(
        winding: WindingOperator | CustomWindingOperator,
        qualityOptions?: Partial<PathQualityOptions>
    ): Polygon2[] {
        const mesh = this.toMesh(winding, qualityOptions);
        return mesh.getFaces().map((f) => new Polygon2(f.getPoints()));
    }

    public transform(mat: Matrix3x2 | Matrix3x3): void {
        const points = this.points;
        for (let i = 0; i < points.length; i++) {
            points[i] = mat.mapPoint(points[i]);
        }
    }
}
