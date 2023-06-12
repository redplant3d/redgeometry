import { expect, test } from "vitest";
import { PathCommandType, type PathCommand } from "../../src/core/path.js";
import { copyCommandsReversed } from "../../src/internal/path.js";

const cmdMove: PathCommand = { type: PathCommandType.Move };
const cmdLine: PathCommand = { type: PathCommandType.Linear };
const cmdQuad: PathCommand = { type: PathCommandType.Quadratic };
const cmdClose: PathCommand = { type: PathCommandType.Close };

test("copyCommandsReversedAppend", () => {
    const input1: PathCommand[] = [];
    const input2: PathCommand[] = [cmdMove];
    const input3: PathCommand[] = [cmdMove, cmdClose];
    const input4: PathCommand[] = [cmdMove, cmdLine];
    const input5: PathCommand[] = [cmdMove, cmdLine, cmdQuad];
    const input6: PathCommand[] = [cmdMove, cmdLine, cmdClose];
    const input7: PathCommand[] = [cmdMove, cmdLine, cmdQuad, cmdClose];
    const input8: PathCommand[] = [cmdLine];
    const input9: PathCommand[] = [cmdLine, cmdQuad];

    const output1 = copyCommandsReversedHelper(input1, true);
    const output2 = copyCommandsReversedHelper(input2, true);
    const output3 = copyCommandsReversedHelper(input3, true);
    const output4 = copyCommandsReversedHelper(input4, true);
    const output5 = copyCommandsReversedHelper(input5, true);
    const output6 = copyCommandsReversedHelper(input6, true);
    const output7 = copyCommandsReversedHelper(input7, true);
    const output8 = copyCommandsReversedHelper(input8, true);
    const output9 = copyCommandsReversedHelper(input9, true);

    expect(output1).toEqual([]);
    expect(output2).toEqual([]);
    expect(output3).toEqual([cmdClose]);
    expect(output4).toEqual([cmdLine]);
    expect(output5).toEqual([cmdQuad, cmdLine]);
    expect(output6).toEqual([cmdLine, cmdClose]);
    expect(output7).toEqual([cmdQuad, cmdLine, cmdClose]);
    expect(output8).toEqual([cmdLine]);
    expect(output9).toEqual([cmdQuad, cmdLine]);
});

test("copyCommandsReversed", () => {
    const input1: PathCommand[] = [];
    const input2: PathCommand[] = [cmdMove];
    const input3: PathCommand[] = [cmdMove, cmdClose];
    const input4: PathCommand[] = [cmdMove, cmdLine];
    const input5: PathCommand[] = [cmdMove, cmdLine, cmdQuad];
    const input6: PathCommand[] = [cmdMove, cmdLine, cmdClose];
    const input7: PathCommand[] = [cmdMove, cmdLine, cmdQuad, cmdClose];
    const input8: PathCommand[] = [cmdLine];
    const input9: PathCommand[] = [cmdLine, cmdQuad];

    const output1 = copyCommandsReversedHelper(input1, false);
    const output2 = copyCommandsReversedHelper(input2, false);
    const output3 = copyCommandsReversedHelper(input3, false);
    const output4 = copyCommandsReversedHelper(input4, false);
    const output5 = copyCommandsReversedHelper(input5, false);
    const output6 = copyCommandsReversedHelper(input6, false);
    const output7 = copyCommandsReversedHelper(input7, false);
    const output8 = copyCommandsReversedHelper(input8, false);
    const output9 = copyCommandsReversedHelper(input9, false);

    expect(output1).toEqual([]);
    expect(output2).toEqual([cmdMove]);
    expect(output3).toEqual([cmdMove, cmdClose]);
    expect(output4).toEqual([cmdMove, cmdLine]);
    expect(output5).toEqual([cmdMove, cmdQuad, cmdLine]);
    expect(output6).toEqual([cmdMove, cmdLine, cmdClose]);
    expect(output7).toEqual([cmdMove, cmdQuad, cmdLine, cmdClose]);
    expect(output8).toEqual([cmdLine]);
    expect(output9).toEqual([cmdQuad, cmdLine]);
});

function copyCommandsReversedHelper(inputCommands: PathCommand[], append: boolean): PathCommand[] {
    const output: PathCommand[] = [];

    if (append && inputCommands[0]?.type === PathCommandType.Move) {
        copyCommandsReversed(inputCommands, 1, output, output.length, inputCommands.length - 1);
    } else {
        copyCommandsReversed(inputCommands, 0, output, output.length, inputCommands.length);
    }

    return output;
}
