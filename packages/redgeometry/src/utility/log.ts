import { formatString, type FormatParameters } from "./string.ts";

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

    public constructor(options: LogOptions) {
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

    public error(fmt: string, ...params: FormatParameters): void {
        const message = formatString(fmt, ...params);
        this.errorFn(message);
    }

    public info(fmt: string, ...params: FormatParameters): void {
        const message = formatString(fmt, ...params);
        this.infoFn(message);
    }

    public warn(fmt: string, ...params: FormatParameters): void {
        const message = formatString(fmt, ...params);
        this.warnFn(message);
    }
}

// Global log object
export const log: Log = new Log({
    errorFn: console.error,
    warnFn: console.warn,
    infoFn: console.info,
});
