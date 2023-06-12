import { expect, test } from "vitest";
import { formatString } from "../../src/utility/string.js";

test("formatString", () => {
    expect(formatString("{} {}", 0, 1)).toEqual("0 1");
    expect(formatString("{1} {0}", 0, 1)).toEqual("1 0");
    expect(formatString("{{{}}}", 0)).toEqual("{0}");
    expect(formatString("{{}}")).toEqual("{}");
});

test("formatStringThrow", () => {
    expect(() => formatString("{", 0)).toThrow();
    expect(() => formatString("}", 0)).toThrow();
    expect(() => formatString("{{}", 0)).toThrow();
    expect(() => formatString("{}}", 0)).toThrow();
});
