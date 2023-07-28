import { formatString, type FormatParameters } from "./string.js";

export type AssertFn = () => boolean;
export type LogFn = (message: string) => void;

export type LogOptions = {
    errorFn: LogFn;
    warnFn: LogFn;
    infoFn: LogFn;
};

export class Log {
    public errorFn: LogFn;
    public infoFn: LogFn;
    public warnFn: LogFn;

    constructor(options: LogOptions) {
        this.errorFn = options.errorFn;
        this.infoFn = options.infoFn;
        this.warnFn = options.warnFn;
    }

    public static getStackTrace(error: Error): string | undefined {
        const stack = error.stack;

        if (stack !== undefined) {
            // Skip first line
            const start = stack.indexOf("\n");
            return stack.substring(start);
        } else {
            return undefined;
        }
    }

    public assert(value: boolean, fmt: string, ...params: FormatParameters): void {
        if (!value) {
            const message = formatString(fmt, ...params);
            this.errorFn(message);
        }
    }

    public assertDebug(value: boolean, fmt: string, ...params: FormatParameters): void {
        if (REDGEOMETRY_DEBUG && !value) {
            const message = formatString(fmt, ...params);
            this.errorFn(message);
        }
    }

    public assertFn(valueFn: AssertFn, fmt: string, ...params: FormatParameters): void {
        if (!valueFn()) {
            const message = formatString(fmt, ...params);
            this.errorFn(message);
        }
    }

    public assertFnDebug(valueFn: AssertFn, fmt: string, ...params: FormatParameters): void {
        if (REDGEOMETRY_DEBUG && !valueFn()) {
            const message = formatString(fmt, ...params);
            this.errorFn(message);
        }
    }

    public error(fmt: string, ...params: FormatParameters): void {
        const message = formatString(fmt, ...params);
        this.errorFn(message);
    }

    public errorDebug(fmt: string, ...params: FormatParameters): void {
        if (REDGEOMETRY_DEBUG) {
            const message = formatString(fmt, ...params);
            this.errorFn(message);
        }
    }

    public info(fmt: string, ...params: FormatParameters): void {
        const message = formatString(fmt, ...params);
        this.infoFn(message);
    }

    public infoDebug(fmt: string, ...params: FormatParameters): void {
        if (REDGEOMETRY_DEBUG) {
            const message = formatString(fmt, ...params);
            this.infoFn(message);
        }
    }

    public warn(fmt: string, ...params: FormatParameters): void {
        const message = formatString(fmt, ...params);
        this.warnFn(message);
    }

    public warnDebug(fmt: string, ...params: FormatParameters): void {
        if (REDGEOMETRY_DEBUG) {
            const message = formatString(fmt, ...params);
            this.warnFn(message);
        }
    }
}
