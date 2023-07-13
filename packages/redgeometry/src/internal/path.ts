import { WindingOperator, type CustomWindingOperator } from "../core/path-options.js";
import { PathCommandType, type PathCommand } from "../core/path.js";
import { assertDebug } from "../utility/debug.js";

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

    if (src[srcStart]?.type === PathCommandType.Move) {
        dest[destIdx++] = { type: PathCommandType.Move };
        srcEnd += 1;
    }

    if (src[srcIdx]?.type === PathCommandType.Close) {
        needsClose = true;
        srcIdx -= 1;
    }

    while (srcIdx >= srcEnd) {
        const cmd = src[srcIdx--];

        if (cmd.type === PathCommandType.Move) {
            if (needsClose) {
                dest[destIdx++] = { type: PathCommandType.Close };
            }

            dest[destIdx++] = { type: PathCommandType.Move };
            needsClose = false;
        } else if (cmd.type === PathCommandType.Close) {
            dest[destIdx++] = { type: PathCommandType.Move };
            needsClose = true;
        } else {
            dest[destIdx++] = cmd;
        }
    }

    if (needsClose) {
        dest[destIdx++] = { type: PathCommandType.Close };
    }
}

export function isWindingInside(wind: number, windingOperator: WindingOperator | CustomWindingOperator): boolean {
    switch (windingOperator) {
        case WindingOperator.NonZero:
            return wind !== 0;
        case WindingOperator.EvenOdd:
            return (wind & 1) !== 0;
        case WindingOperator.Positive:
            return wind > 0;
        case WindingOperator.Negative:
            return wind < 0;
        default:
            return windingOperator(wind);
    }
}
