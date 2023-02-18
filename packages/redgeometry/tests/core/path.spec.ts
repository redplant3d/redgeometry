import { expect, test } from "vitest";
import { Path2, PathCommand, PathCommandType, Point2 } from "../../src";

const cmdMove: PathCommand = { type: PathCommandType.Move };
const cmdLine: PathCommand = { type: PathCommandType.Linear };

test("addPathAppend", () => {
    const p1 = new Point2(100, 100);
    const p2 = new Point2(200, 200);
    const p3 = new Point2(300, 300);
    const p4 = new Point2(400, 400);

    const path1 = new Path2();
    path1.moveTo(p1);
    path1.lineTo(p2);

    const path2 = new Path2();
    path2.moveTo(p3);
    path2.lineTo(p4);

    path1.addPath(path2, true);

    expect(path1.getCommands()).toEqual([cmdMove, cmdLine, cmdLine]);
    expect(path1.getPoints()).toEqual([p1, p2, p4]);
});

test("addPathReversedAppend", () => {
    const p1 = new Point2(100, 100);
    const p2 = new Point2(200, 200);
    const p3 = new Point2(300, 300);
    const p4 = new Point2(400, 400);

    const path1 = new Path2();
    path1.moveTo(p1);
    path1.lineTo(p2);

    const path2 = new Path2();
    path2.moveTo(p3);
    path2.lineTo(p4);

    path1.addPathReversed(path2, true);

    expect(path1.getCommands()).toEqual([cmdMove, cmdLine, cmdLine]);
    expect(path1.getPoints()).toEqual([p1, p2, p3]);
});
