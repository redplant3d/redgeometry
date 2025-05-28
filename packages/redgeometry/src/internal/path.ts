import { WindingOperator, type CustomWindingOperator } from "../core/path-options.js";
import { Path2, PathCommandType, type PathCommand } from "../core/path.js";
import { Edge2 } from "../primitives/edge.js";
import { Vector2, type ReadonlyVector2 } from "../primitives/vector.js";
import { assertDebug } from "../utility/debug.js";

type Cell = {
    center: ReadonlyVector2;
    halfCellSize: number;
    centerDist: number;
    cellDist: number;
};

export class PIAHelper {
    public cellCandidate: Cell;
    public cells: Cell[];
    public path: Path2;
    public threshold: number;
    public windingOperator: WindingOperator | CustomWindingOperator;

    constructor(
        path: Path2,
        windingOperator: WindingOperator | CustomWindingOperator,
        threshold: number,
        cells: Cell[],
        cellCandidate: Cell,
    ) {
        this.path = path;
        this.windingOperator = windingOperator;
        this.threshold = threshold;
        this.cells = cells;
        this.cellCandidate = cellCandidate;
    }

    public static createCell(
        path: Path2,
        windingOperator: WindingOperator | CustomWindingOperator,
        center: ReadonlyVector2,
        halfCellSize: number,
    ): Cell {
        let dmin = Number.POSITIVE_INFINITY;
        let wind = 0;

        for (const c of path.getCurveIterator()) {
            const e = new Edge2(c.p0, c.pn);
            const d = e.getClosestPointDistance(center);

            dmin = Math.min(dmin, d);
            wind += c.getWindingAt(center);
        }

        // Lower distance limit of cell (center)
        const isInside = isWindingInside(wind, windingOperator);
        const centerDist = isInside ? dmin : -dmin;

        // Upper distance limit of the cell (farthest corner)
        const cellDist = centerDist + Math.SQRT2 * halfCellSize;

        return { center, halfCellSize, centerDist, cellDist };
    }

    public addCellCandidate(x: number, y: number, halfCellSize: number): void {
        const center = new Vector2(x, y);
        const cell = PIAHelper.createCell(this.path, this.windingOperator, center, halfCellSize);

        if (this.isBetterCandidate(cell)) {
            // TODO: Use sorted insert for array?
            this.cells.push(cell);
            this.cells.sort((a, b) => a.cellDist - b.cellDist);
        }

        if (this.cellCandidate.centerDist < cell.centerDist) {
            this.cellCandidate = cell;
        }
    }

    public getNextCell(): Cell | undefined {
        return this.cells.pop();
    }

    public isBetterCandidate(cell: Cell): boolean {
        return cell.cellDist - this.cellCandidate.centerDist > this.threshold;
    }
}

export function copyCommandsReversed(
    src: PathCommand[],
    srcStart: number,
    dest: PathCommand[],
    destStart: number,
    length: number,
): void {
    assertDebug(
        length <= src.length - srcStart,
        "Parameter 'length' must be smaller or equal to length of 'src' to avoid over-read",
    );

    let srcEnd = srcStart;
    let srcIdx = srcStart + length - 1;
    let destIdx = destStart;
    let needsClose = false;

    if (src[srcStart]?.type === PathCommandType.MOVE) {
        dest[destIdx++] = { type: PathCommandType.MOVE };
        srcEnd += 1;
    }

    if (src[srcIdx]?.type === PathCommandType.CLOSE) {
        needsClose = true;
        srcIdx -= 1;
    }

    while (srcIdx >= srcEnd) {
        const cmd = src[srcIdx--];

        if (cmd.type === PathCommandType.MOVE) {
            if (needsClose) {
                dest[destIdx++] = { type: PathCommandType.CLOSE };
            }

            dest[destIdx++] = { type: PathCommandType.MOVE };
            needsClose = false;
        } else if (cmd.type === PathCommandType.CLOSE) {
            dest[destIdx++] = { type: PathCommandType.MOVE };
            needsClose = true;
        } else {
            dest[destIdx++] = cmd;
        }
    }

    if (needsClose) {
        dest[destIdx++] = { type: PathCommandType.CLOSE };
    }
}

export function isWindingInside(wind: number, windingOperator: WindingOperator | CustomWindingOperator): boolean {
    switch (windingOperator) {
        case 0 /* NON_ZERO */:
            return wind !== 0;
        case 1 /* EVEN_ODD */:
            return (wind & 1) !== 0;
        case 2 /* POSITIVE */:
            return wind > 0;
        case 3 /* NEGATIVE */:
            return wind < 0;
        default:
            return windingOperator(wind);
    }
}
