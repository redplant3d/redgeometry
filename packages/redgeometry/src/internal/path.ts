import { PathCommandType, type PathCommand } from "../core/path.ts";
import { assertDebug } from "../utility/debug.ts";

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
