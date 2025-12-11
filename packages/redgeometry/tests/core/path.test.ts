import { expect, test } from "vitest";
import { Path2, PathCommandType, type PathCommand } from "../../src/core/path.ts";
import { Vector2 } from "../../src/primitives/vector.ts";

const cmdMove: PathCommand = { type: PathCommandType.MOVE };
const cmdLine: PathCommand = { type: PathCommandType.LINEAR };

test("addPathAppend", () => {
    const p1 = new Vector2(100, 100);
    const p2 = new Vector2(200, 200);
    const p3 = new Vector2(300, 300);
    const p4 = new Vector2(400, 400);

    const path1 = Path2.createEmpty();
    path1.moveTo(p1);
    path1.lineTo(p2);

    const path2 = Path2.createEmpty();
    path2.moveTo(p3);
    path2.lineTo(p4);

    path1.addPath(path2, true);

    expect(path1.getCommands()).toEqual([cmdMove, cmdLine, cmdLine]);
    expect(path1.getPoints()).toEqual([p1, p2, p4]);
});

test("addPathReversedAppend", () => {
    const p1 = new Vector2(100, 100);
    const p2 = new Vector2(200, 200);
    const p3 = new Vector2(300, 300);
    const p4 = new Vector2(400, 400);

    const path1 = Path2.createEmpty();
    path1.moveTo(p1);
    path1.lineTo(p2);

    const path2 = Path2.createEmpty();
    path2.moveTo(p3);
    path2.lineTo(p4);

    path1.addPathReversed(path2, true);

    expect(path1.getCommands()).toEqual([cmdMove, cmdLine, cmdLine]);
    expect(path1.getPoints()).toEqual([p1, p2, p3]);
});
