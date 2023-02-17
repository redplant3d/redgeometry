import { formatString } from "./string";

let showTrace = false;
let throwErrors = false;

export class Debug {
    public static get isDev(): boolean {
        return process.env.NODE_ENV === "development";
    }

    public static get isProd(): boolean {
        return process.env.NODE_ENV === "production";
    }

    public static get showTrace(): boolean {
        return showTrace;
    }

    public static set showTrace(value: boolean) {
        showTrace = value;
    }

    public static get throwErrors(): boolean {
        return throwErrors;
    }

    public static set throwErrors(value: boolean) {
        throwErrors = value;
    }

    public static assert(value: boolean, fmt?: string, ...params: unknown[]): void {
        if (process.env.NODE_ENV === "development" && !value) {
            let message;

            if (fmt !== undefined) {
                message = formatString(fmt, ...params);
            } else {
                message = "Assertion failed";
            }

            if (showTrace) {
                message += this.buildStackTrace(new Error());
            }

            this.writeError(message);
        }
    }

    public static assertFn(valueFn: () => boolean, fmt?: string, ...params: unknown[]): void {
        if (process.env.NODE_ENV === "development" && !valueFn()) {
            let message;

            if (fmt !== undefined) {
                message = formatString(fmt, ...params);
            } else {
                message = "Assertion failed";
            }

            if (showTrace) {
                message += this.buildStackTrace(new Error());
            }

            this.writeError(message);
        }
    }

    public static assertUnreachable(value: never): never {
        this.throw(`Object with value '${value}' must not exist`);
    }

    public static error(fmt: string, ...params: unknown[]): void {
        let message = formatString(fmt, ...params);

        if (throwErrors) {
            this.throw(message);
        }

        if (showTrace) {
            message += this.buildStackTrace(new Error());
        }

        this.writeError(message);
    }

    public static log(fmt: string, ...params: unknown[]): void {
        if (process.env.NODE_ENV === "development") {
            const message = formatString(fmt, ...params);

            this.writeLog(message);
        }
    }

    public static throw(message?: string): never {
        throw new Error(message);
    }

    public static trace(message?: string): void {
        if (message !== undefined) {
            message = "Trace: " + message;
        } else {
            message = "Trace";
        }

        message += this.buildStackTrace(new Error());

        this.writeLog(message);
    }

    public static warn(fmt: string, ...params: unknown[]): void {
        let message = formatString(fmt, ...params);

        if (showTrace) {
            message += this.buildStackTrace(new Error());
        }

        this.writeWarn(message);
    }

    private static buildStackTrace(error: Error): string | undefined {
        if (error.stack !== undefined) {
            // Skip first line
            const stack = error.stack;
            const start = stack.indexOf("\n");

            return stack.substring(start);
        } else {
            return undefined;
        }
    }

    private static writeError(message: string): void {
        console.error(message);
    }

    private static writeLog(message: string): void {
        console.log(message);
    }

    private static writeWarn(message: string): void {
        console.warn(message);
    }
}
