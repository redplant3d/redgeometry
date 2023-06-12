import { ROUND_CAPS } from "redgeometry/src/core/path-options.js";
import { Path2 } from "redgeometry/src/core/path.js";
import { RandomXSR128 } from "redgeometry/src/utility/random.js";
import { AppContext2D } from "../context.js";
import { createPath } from "../data.js";
import { ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../input.js";
import { AppLauncher, type AppPart } from "../launcher.js";
import { getJoin } from "../utility.js";

export class PathOperationsAppPart implements AppPart {
    private context: AppContext2D;
    private input: Path2;
    private launcher: AppLauncher;
    private output: Path2;

    public inputCount: TextBoxInputElement;
    public inputJoin: ComboBoxInputElement;
    public inputOp: ComboBoxInputElement;
    public inputParam1: RangeInputElement;
    public inputParam2: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new TextBoxInputElement("count", "10");
        this.inputCount.setStyle("width: 80px");

        this.inputOp = new ComboBoxInputElement("op", "flatten");
        this.inputOp.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputOp.setOptionValues("flatten", "simplify", "offset", "dash", "stroke", "dashstroke");

        this.inputParam1 = new RangeInputElement("param1", "0", "100", "50");
        this.inputParam1.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParam1.setStyle("width: 200px");

        this.inputParam2 = new RangeInputElement("param2", "0", "100", "50");
        this.inputParam2.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParam2.setStyle("width: 200px");

        this.inputJoin = new ComboBoxInputElement("join", "bevel");
        this.inputJoin.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputJoin.setOptionValues("bevel", "miter", "miterclip", "round");

        this.input = new Path2();
        this.output = new Path2();
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.context.drawPath(this.input, "#666666FF", 1);
        this.context.drawPath(this.output, "#FF0000FF", 2);
        this.context.fillPoints(this.input.getPoints(), "#00000088", 5);
        this.context.fillPoints(this.output.getPoints(), "#FF000088", 5);
    }

    public reset(): void {
        this.input.clear();
        this.output.clear();
    }

    public update(_delta: number): void {
        this.reset();

        const seed = this.launcher.inputSeed.getInt();
        const generator = this.launcher.inputGenerator.getInt();
        const count = this.inputCount.getInt();
        const op = this.inputOp.getValue();

        const random = RandomXSR128.fromSeedLcg(seed);
        const [canvasWidth, canvasHeight] = this.context.getSize(false);

        const path = createPath(random, generator, count, canvasWidth, canvasHeight);
        // path.close();

        this.input = path;

        const caps = ROUND_CAPS;

        switch (op) {
            case "flatten": {
                const simplifyTolerance = (10 * this.inputParam1.getFloat() + 1) / 10;
                const flattenTolerance = (10 * this.inputParam2.getFloat() + 1) / 10;
                this.output = path.flatten(false, { flattenTolerance, simplifyTolerance });
                break;
            }
            case "simplify": {
                const simplifyTolerance = (10 * this.inputParam1.getFloat() + 1) / 10;
                this.output = path.simplify({ simplifyTolerance });
                break;
            }
            case "offset": {
                const distance = this.inputParam1.getFloat() - 50;
                const miterLimit = this.inputParam2.getFloat() / 10;
                const join = getJoin(this.inputJoin.getValue());
                this.output = path.offset({ distance, join, miterLimit });
                break;
            }
            case "dash": {
                const d = this.inputParam1.getFloat();
                const array = [2 * d, d];
                const offset = 10 * this.inputParam2.getFloat();
                this.output = path.dash({ array, offset });
                break;
            }
            case "stroke": {
                const width = this.inputParam1.getFloat();
                const miterLimit = this.inputParam2.getFloat() / 10;
                const join = getJoin(this.inputJoin.getValue());
                this.output = path.stroke({ caps, join, miterLimit, width });
                break;
            }
            case "dashstroke": {
                const d = this.inputParam1.getFloat();
                const dashOffset = 10 * this.inputParam2.getFloat();
                const join = getJoin(this.inputJoin.getValue());
                const dashArray = [2 * d, d];
                const width = 50;
                this.output = path.stroke({ caps, dashArray, dashOffset, join, width });
                break;
            }
        }
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputOp);
        this.launcher.addAppInput(this.inputCount);
        this.launcher.addAppInput(this.inputParam1);
        this.launcher.addAppInput(this.inputParam2);
        this.launcher.addAppInput(this.inputJoin);
    }
}
