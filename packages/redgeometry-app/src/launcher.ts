import { assertUnreachable } from "redgeometry/src/utility/debug.js";
import { AnimationFrameContext } from "./animationframe.js";
import { AppContext2D } from "./context.js";
import { createRandomSeed } from "./data.js";
import {
    AppInputElement,
    AppValueInputElement,
    ButtonInputElement,
    ComboBoxInputElement,
    TextBoxInputElement,
} from "./input.js";

export interface AppPart {
    create(): void;
    render(): void;
    reset(): void;
    update(delta: number): void;
    updateLayout(): void;
}

export type AppLauncherContext = {
    canvas2DContext?: AppContext2D;
    canvas2DElement: HTMLCanvasElement;
    canvasContainerElement: HTMLElement;
};

export type Canvas2DPartType<T extends AppPart> = {
    new (appLauncher: AppLauncher, context: AppContext2D): T;
};

export enum AnimationMode {
    Step,
    Loop,
}

export enum ContextType {
    Canvas2D,
}

type AppEntry = {
    animationMode: AnimationMode;
    contextId: ContextType;
    part: AppPart;
};

export class AppLauncher {
    private animationFrameContext: AnimationFrameContext<this>;
    private currentEntry?: AppEntry;
    private inputs: Map<string, AppInputElement>;
    private options: AppLauncherContext;
    private parts: Map<string, AppEntry>;
    private time: number;

    public inputAppPart: ComboBoxInputElement;
    public inputGenerator: TextBoxInputElement;
    public inputRandomize: ButtonInputElement;
    public inputSeed: TextBoxInputElement;
    public inputUpdate: ButtonInputElement;

    public constructor(options: AppLauncherContext) {
        this.options = options;

        this.animationFrameContext = new AnimationFrameContext(window, this, AppLauncher.animationFrameCallback);
        this.inputs = new Map<string, AppInputElement>();
        this.parts = new Map<string, AppEntry>();
        this.time = 0;

        this.inputAppPart = new ComboBoxInputElement("app");
        this.inputAppPart.addEventListener("input", () => this.onAppInput());

        this.inputRandomize = new ButtonInputElement("randomize", "randomize");
        this.inputRandomize.addEventListener("click", () => this.onRandomizeClick());

        this.inputSeed = new TextBoxInputElement("seed", createRandomSeed().toString());
        this.inputSeed.setStyle("width: 80px");

        this.inputGenerator = new TextBoxInputElement("generator", "0");
        this.inputGenerator.setStyle("width: 25px");

        this.inputUpdate = new ButtonInputElement("update", "update");
        this.inputUpdate.addEventListener("click", () => this.onUpdateClick());
    }

    public static async createContext(): Promise<AppLauncherContext> {
        const paramsElement = AppLauncher.createElement("div", {
            id: "params",
            style: "height: 30px",
        });

        const canvasContainerElement = AppLauncher.createElement("div", {
            id: "canvasContainer",
        });

        const canvas2DElement = AppLauncher.createElement("canvas", {
            id: "canvas2D",
            style: "border: 1px solid black",
        });

        document.body.appendChild(paramsElement);
        document.body.appendChild(canvasContainerElement);

        const canvas2DContext = AppContext2D.fromCanvas(canvas2DElement);

        return {
            canvasContainerElement,
            canvas2DContext,
            canvas2DElement,
        };
    }

    public addAppInput(input: AppInputElement): void {
        const id = input.getId();
        const prevInput = this.inputs.get(id);

        if (prevInput !== undefined) {
            prevInput.unregister();
        }

        this.inputs.set(id, input);
    }

    public addCanvas2D<T extends AppPart>(
        appId: string,
        animationMode: AnimationMode,
        PartType: Canvas2DPartType<T>
    ): void {
        if (this.options.canvas2DContext === undefined) {
            return;
        }

        const prevEntry = this.parts.get(appId);

        if (prevEntry !== undefined) {
            prevEntry.part.reset();
        }

        this.parts.set(appId, {
            animationMode,
            part: new PartType(this, this.options.canvas2DContext),
            contextId: ContextType.Canvas2D,
        });
    }

    public init(defaultAppId: string): void {
        // Set default app
        this.inputAppPart.setDefaultValue(defaultAppId);

        // Resizing
        window.addEventListener("resize", () => this.onResize(), false);

        // Retrieve app id list
        this.inputAppPart.setOptionValues(...this.parts.keys());

        // Set app part, then update layout
        const params = new URLSearchParams(window.location.search);
        const appId = params.get("app") ?? this.inputAppPart.getValue();

        this.currentEntry = this.parts.get(appId);

        this.updateLayout();

        // Update params
        for (const [key, value] of params.entries()) {
            const input = this.inputs.get(key);

            if (input instanceof AppValueInputElement) {
                input.setValue(value);
            }
        }

        // Finally run the app
        this.resizeContext();
        this.run(true, true);
    }

    public requestUpdate(writeParams = false): void {
        if (writeParams) {
            this.writeParams();
        }

        if (this.currentEntry !== undefined && this.currentEntry.animationMode === AnimationMode.Step) {
            this.animationFrameContext.stepAnimation();
        }
    }

    private static animationFrameCallback(time: number, target: AppLauncher): void {
        const timeLast = target.time;
        const delta = time - timeLast;

        if (target.currentEntry !== undefined) {
            target.time = time;
            target.currentEntry.part.update(delta);
            target.currentEntry.part.render();
        }
    }

    private static createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        attributes?: Record<string, string>
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tagName);

        for (const qualifiedName in attributes) {
            element.setAttribute(qualifiedName, attributes[qualifiedName]);
        }

        return element;
    }

    private onAppInput(): void {
        const appId = this.inputAppPart.getValue();
        const nextPart = this.parts.get(appId);

        if (nextPart !== undefined && nextPart !== this.currentEntry) {
            this.currentEntry?.part.reset();
            this.currentEntry = nextPart;
            this.updateLayout();
        }

        this.run(true, true);
        this.inputAppPart.focus();
    }

    private onRandomizeClick(): void {
        this.inputSeed.setValue(createRandomSeed().toString());
        this.run(true, true);
    }

    private onResize(): void {
        this.resizeContext();
        this.run(false, false);
    }

    private onUpdateClick(): void {
        this.run(true, true);
    }

    private resizeContext(): void {
        const width = window.innerWidth - 20;
        const height = window.innerHeight - 50;

        this.options.canvas2DContext?.resize(width, height);
    }

    private run(create: boolean, writeParams: boolean): void {
        if (writeParams) {
            this.writeParams();
        }

        const entry = this.currentEntry;

        if (entry === undefined) {
            return;
        }

        const canvasContainer = this.options.canvasContainerElement;

        this.animationFrameContext.stopAnimation();

        if (create) {
            for (const child of canvasContainer.childNodes) {
                canvasContainer.removeChild(child);
            }
        }

        switch (entry.contextId) {
            case ContextType.Canvas2D: {
                canvasContainer.appendChild(this.options.canvas2DElement);
                break;
            }
            default: {
                assertUnreachable(entry.contextId);
            }
        }

        if (create) {
            entry.part.create();
        }

        switch (entry.animationMode) {
            case AnimationMode.Loop: {
                this.animationFrameContext.startAnimation();
                break;
            }
            case AnimationMode.Step: {
                this.animationFrameContext.stepAnimation();
                break;
            }
            default: {
                assertUnreachable(entry.animationMode);
            }
        }
    }

    private updateLayout(): void {
        // Remove old inputs
        for (const input of this.inputs.values()) {
            input.unregister();
        }

        this.inputs.clear();

        // Launcher layout
        this.addAppInput(this.inputAppPart);
        this.addAppInput(this.inputRandomize);
        this.addAppInput(this.inputSeed);
        this.addAppInput(this.inputGenerator);
        this.addAppInput(this.inputUpdate);

        // App part layout
        this.currentEntry?.part.updateLayout();

        // Add inputs to DOM
        const parent = document.getElementById("params");

        if (parent !== null) {
            for (const input of this.inputs.values()) {
                input.register(parent);
            }
        }
    }

    private writeParams(): void {
        const params = new URLSearchParams();

        for (const input of this.inputs.values()) {
            if (input instanceof AppValueInputElement) {
                params.set(input.getId(), input.getValue());
            }
        }

        window.history.pushState(null, "", "?" + params.toString());
    }
}
