import { PathCommand, PathCommandType } from "../core";
import { Debug } from "../utility";

export function copyCommandsReversed(
    src: PathCommand[],
    srcStart: number,
    dest: PathCommand[],
    destStart: number,
    length: number
): void {
    Debug.assert(
        length <= src.length - srcStart,
        "Parameter 'length' must be smaller or equal to length of 'src' to avoid over-read"
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
