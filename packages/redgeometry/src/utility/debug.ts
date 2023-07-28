import { Log } from "./log.js";
import { formatString, type FormatParameters } from "./string.js";

// Global log object
export const log = new Log({
    errorFn: console.error,
    warnFn: console.warn,
    infoFn: console.info,
});

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
