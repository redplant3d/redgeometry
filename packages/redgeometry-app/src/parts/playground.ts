import { log, RandomXSR128 } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

export class PlaygroundAppPart implements AppPart {
    private context: AppContext2D;
    private launcher: AppLauncher;

    public inputParam1: RangeInputElement;
    public inputParam2: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputParam1 = new RangeInputElement("param1", "1", "100", "50");
        this.inputParam1.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParam1.setStyle("width: 200px");

        this.inputParam2 = new RangeInputElement("param2", "1", "100", "50");
        this.inputParam2.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParam2.setStyle("width: 200px");
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
    }

    public reset(): void {
        return;
    }

    public update(_delta: number): void {
        this.reset();

        const seed = this.launcher.inputSeed.getInt();

        const param1 = this.inputParam1.getInt();
        const param2 = this.inputParam2.getInt();

        const random = RandomXSR128.fromSeedLcg(seed);

        log.infoDebug("param1 = {}, param2 = {}, random = {}", param1, param2, random.nextInt());
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputParam1);
        this.launcher.addAppInput(this.inputParam2);
    }
}
