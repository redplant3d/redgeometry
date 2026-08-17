import { formatString, type FormatParameters } from "./string.ts";

export function assert(value: boolean, fmt?: string, ...params: FormatParameters): asserts value {
    if (!value) {
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
