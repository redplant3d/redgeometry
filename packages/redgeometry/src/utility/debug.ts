import { Log } from "./log";
import { formatString } from "./string";

// Global log object
export const log = new Log({
    errorFn: console.error,
    warnFn: console.warn,
    infoFn: console.info,
});

export function assert(value: boolean, fmt?: string, ...params: unknown[]): asserts value {
    if (!value) {
        const message = formatString(fmt ?? "Assertion failed", ...params);
        throw new Error(message);
    }
}

export function assertDebug(value: boolean, fmt?: string, ...params: unknown[]): asserts value {
    if (process.env.NODE_ENV === "development" && !value) {
        const message = formatString(fmt ?? "Assertion failed", ...params);
        throw new Error(message);
    }
}

export function assertUnreachable(value: never): never {
    const message = formatString("Object with value '{}' must not exist", value);
    throw new Error(message);
}
