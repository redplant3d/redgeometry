import { throwError } from "redgeometry/src/utility/debug.js";

type InputElementEvent = {
    type: string;
    listener: EventListenerOrEventListenerObject;
};

export abstract class AppInputElement {
    private element: HTMLElement;
    private events: InputElementEvent[];
    private id: string;
    private isBound: boolean;
    private style?: string;

    constructor(element: HTMLElement, id: string) {
        element.id = id;

        this.element = element;
        this.id = id;

        this.events = [];
        this.isBound = false;
    }

    public addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        if (!this.isBound) {
            this.events.push({ type, listener });
        } else {
            throwError("Cannot add event listener on bound input element");
        }
    }

    public focus(): void {
        this.element.focus();
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getId(): string {
        return this.id;
    }

    public register(parent: HTMLElement): void {
        if (!this.isBound) {
            this.isBound = true;

            for (const event of this.events) {
                this.element.addEventListener(event.type, event.listener);
            }

            if (this.style !== undefined) {
                this.element.setAttribute("style", this.style);
            }

            parent.appendChild(this.element);
            parent.append("\n");
        } else {
            throwError("Already bound");
        }
    }

    public setStyle(style: string): void {
        this.style = style;
    }

    public unregister(): void {
        for (const event of this.events) {
            this.element.removeEventListener(event.type, event.listener);
        }

        const parent = this.element.parentElement;

        if (parent !== null) {
            parent.removeChild(this.element);
        }

        this.isBound = false;
    }
}

export class AppValueInputElement extends AppInputElement {
    private defaultValue: string;
    private valueInputElement: HTMLInputElement | HTMLSelectElement;

    constructor(element: HTMLInputElement | HTMLSelectElement, id: string, defaultValue: string) {
        super(element, id);

        element.value = defaultValue;

        this.valueInputElement = element;
        this.defaultValue = defaultValue;
    }

    public getDefaultValue(): string {
        return this.defaultValue;
    }

    public getFloat(): number {
        return parseFloat(this.getValue());
    }

    public getInt(): number {
        return parseInt(this.getValue());
    }

    public getValue(): string {
        return this.valueInputElement.value;
    }

    public setDefaultValue(value: string): void {
        this.defaultValue = value;
    }

    public setValue(value: string): void {
        this.valueInputElement.value = value;
    }
}

export class ButtonInputElement extends AppInputElement {
    constructor(id: string, label: string) {
        const button = document.createElement("button");
        button.textContent = label;

        super(button, id);
    }
}

export class TextBoxInputElement extends AppValueInputElement {
    constructor(id: string, defaultValue = "") {
        const input = document.createElement("input");
        input.type = "text";

        super(input, id, defaultValue);
    }
}

export class RangeInputElement extends AppValueInputElement {
    constructor(id: string, min: string, max: string, defaultValue = "0") {
        const input = document.createElement("input");
        input.type = "range";
        input.className = "slider";
        input.min = min;
        input.max = max;

        super(input, id, defaultValue);
    }
}

export class ComboBoxInputElement extends AppValueInputElement {
    private selectElement: HTMLSelectElement;

    constructor(id: string, defaultValue = "") {
        const selectElement = document.createElement("select");

        super(selectElement, id, defaultValue);

        this.selectElement = selectElement;
    }

    public setOptionValues(...values: string[]): void {
        for (const value of values) {
            const option = document.createElement("option");
            option.text = value;
            this.selectElement.appendChild(option);
        }

        this.selectElement.value = this.getDefaultValue();
    }
}
