import type { Enum } from "../utility/types.js";

export type CustomWindingOperator = (wind: number) => boolean;

export const WindingOperator = {
    NON_ZERO: 0,
    EVEN_ODD: 1,
    POSITIVE: 2,
    NEGATIVE: 3,
} as const;
export type WindingOperator = Enum<typeof WindingOperator>;

export function isWindingInside(wind: number, windingOperator: WindingOperator | CustomWindingOperator): boolean {
    switch (windingOperator) {
        case 0 /* NON_ZERO */:
            return wind !== 0;
        case 1 /* EVEN_ODD */:
            return (wind & 1) !== 0;
        case 2 /* POSITIVE */:
            return wind > 0;
        case 3 /* NEGATIVE */:
            return wind < 0;
        default:
            return windingOperator(wind);
    }
}
export function isWindingInside2(
    wind1: number,
    wind2: number,
    windingOperator: WindingOperator | CustomWindingOperator,
): [boolean, boolean] {
    let in1 = false;
    let in2 = false;

    switch (windingOperator) {
        case 0 /* NON_ZERO */: {
            in1 = wind1 !== 0;
            in2 = wind2 !== 0;
            break;
        }
        case 1 /* EVEN_ODD */: {
            in1 = (wind1 & 1) !== 0;
            in2 = (wind2 & 1) !== 0;
            break;
        }
        case 2 /* POSITIVE */: {
            in1 = wind1 > 0;
            in2 = wind2 > 0;
            break;
        }
        case 3 /* NEGATIVE */: {
            in1 = wind1 < 0;
            in2 = wind2 < 0;
            break;
        }
        default: {
            in1 = windingOperator(wind1);
            in2 = windingOperator(wind2);
            break;
        }
    }

    return [in1, in2];
}
