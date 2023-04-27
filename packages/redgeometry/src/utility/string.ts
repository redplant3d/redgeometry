import { ValueRef } from "./types";

export type FormatParameters = unknown[];

const OPEN_SYMBOL = "{";
const CLOSE_SYMBOL = "}";

export function formatString(fmt: string, ...params: FormatParameters): string {
    // Running index for unspecified accessors
    const idxRef = { value: 0 };

    let output = "";
    let pos = 0;
    let error = false;
    let open = false;

    for (let i = 0; i < fmt.length; i++) {
        const c = fmt[i];

        if (c === OPEN_SYMBOL) {
            if (!open) {
                // Flush `fmt`
                output += fmt.substring(pos, i);
                pos = i + 1;
                open = true;
            } else if (fmt[i - 1] === OPEN_SYMBOL) {
                // Reset (skip the escaped symbol)
                open = false;
            } else {
                // Unexpected opening symbol
                error = true;
                break;
            }
        } else if (c === CLOSE_SYMBOL) {
            if (open) {
                // Extract and format data
                const data = fmt.substring(pos, i);
                output += formatData(params, idxRef, data);
                pos = i + 1;
                open = false;
            } else if (fmt[i + 1] === CLOSE_SYMBOL) {
                // Flush `fmt` and skip the escaped symbol
                output += fmt.substring(pos, i);
                pos = i + 1;
                i = pos;
            } else {
                // Unmatched closing symbol
                error = true;
                break;
            }
        }
    }

    if (error || open) {
        // Syntax error
        throw new Error("Invalid format string");
    }

    // Flush remaining `fmt`
    output += fmt.substring(pos);

    return output;
}

function formatData(params: FormatParameters, idxRef: ValueRef<number>, data: string): string {
    // Interpret as array index only (for now)
    let idx = parseInt(data);

    if (Number.isNaN(idx) || idx < 0) {
        // Take running index and increment
        idx = idxRef.value;
        idxRef.value += 1;
    }

    return String(params[idx]);
}
