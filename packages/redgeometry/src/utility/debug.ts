import { Log } from "./log.js";
import { formatString, type FormatParameters } from "./string.js";

// Global log object
export const log: Log = new Log({
    errorFn: console.error,
    warnFn: console.warn,
    infoFn: console.info,
});

export class ValidationHelper {
    public errors: string[];

    public constructor() {
        this.errors = [];
    }

    public clear(): void {
        this.errors = [];
    }

    public equal<T>(valueA: T, valueB: T, fmt: string, ...params: FormatParameters): void {
        if (valueA !== valueB) {
            const message = `${formatString(fmt, ...params)}: ${valueA} expected to be EQUAL to ${valueB}`;
            this.errors.push(message);
        }
    }

    public notEqual<T>(valueA: T, valueB: T, fmt: string, ...params: FormatParameters): void {
        if (valueA === valueB) {
            const message = `${formatString(fmt, ...params)}: ${valueA} expected to be NOT EQUAL to ${valueB}`;
            this.errors.push(message);
        }
    }
}

export function assert(value: boolean, fmt?: string, ...params: FormatParameters): asserts value {
    if (!value) {
        const message = formatString(fmt ?? "Assertion failed", ...params);
        throw new Error(message);
    }
}

export function assertDebug(value: boolean, fmt?: string, ...params: FormatParameters): asserts value {
    if (REDGEOMETRY_DEBUG && !value) {
        const message = formatString(fmt ?? "Assertion failed", ...params);
        throw new Error(message);
    }
}

export function assertUnreachable(value: never): never {
    const message = formatString("Object with value '{}' must not exist", value);
    throw new Error(message);
}

export function throwError(fmt: string, ...params: FormatParameters): never {
    const message = formatString(fmt, ...params);
    throw new Error(message);
}
