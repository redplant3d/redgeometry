import { expect, test } from "vitest";
import { ArrayMultiMap, ArrayMultiSet, copyArray, copyArrayReversed } from "../../src/utility/array.js";

test("ArrayMultiSet.findIndex", () => {
    const compareFn = (a: number, b: number): number => a - b;
    const multiSet = ArrayMultiSet.fromArray([2, 4], compareFn);

    const index1 = multiSet.findIndexBy((n) => n === 1);
    const index2 = multiSet.findIndexBy((n) => n === 2);
    const index3 = multiSet.findIndexBy((n) => n === 3);
    const index4 = multiSet.findIndexBy((n) => n === 4);
    const index5 = multiSet.findIndexBy((n) => n === 5);

    expect(index1).toEqual(-1);
    expect(index2).toEqual(0);
    expect(index3).toEqual(-1);
    expect(index4).toEqual(1);
    expect(index5).toEqual(-1);
});

test("ArrayMultiSet.insert", () => {
    const compareFn = (a: number, b: number): number => a - b;
    const multiSet1 = ArrayMultiSet.fromArray([], compareFn);
    const multiSet2 = ArrayMultiSet.fromArray([2, 4], compareFn);
    const multiSet3 = ArrayMultiSet.fromArray([2, 4], compareFn);
    const multiSet4 = ArrayMultiSet.fromArray([2, 4], compareFn);

    multiSet1.insert(3);
    multiSet2.insert(3);
    multiSet3.insert(1);
    multiSet4.insert(5);

    expect(multiSet1.values).toEqual([3]);
    expect(multiSet2.values).toEqual([2, 3, 4]);
    expect(multiSet3.values).toEqual([1, 2, 4]);
    expect(multiSet4.values).toEqual([2, 4, 5]);
});

test("ArrayMultiMap.findIndex", () => {
    const compareFn = (a: number, b: number): number => a - b;
    const multiMap = ArrayMultiMap.fromArray(
        [
            { key: 2, value: 2 },
            { key: 4, value: 4 },
        ],
        compareFn,
    );

    const index1 = multiMap.findIndexBy((n) => n === 1);
    const index2 = multiMap.findIndexBy((n) => n === 2);
    const index3 = multiMap.findIndexBy((n) => n === 3);
    const index4 = multiMap.findIndexBy((n) => n === 4);
    const index5 = multiMap.findIndexBy((n) => n === 5);

    expect(index1).toEqual(-1);
    expect(index2).toEqual(0);
    expect(index3).toEqual(-1);
    expect(index4).toEqual(1);
    expect(index5).toEqual(-1);
});

test("ArrayMultiMap.insert", () => {
    const comp = (a: number, b: number): number => a - b;
    const multiMap1 = ArrayMultiMap.fromArray([], comp);
    const multiMap2 = ArrayMultiMap.fromArray(
        [
            { key: 2, value: 2 },
            { key: 4, value: 4 },
        ],
        comp,
    );
    const multiMap3 = ArrayMultiMap.fromArray(
        [
            { key: 2, value: 2 },
            { key: 4, value: 4 },
        ],
        comp,
    );
    const multiMap4 = ArrayMultiMap.fromArray(
        [
            { key: 2, value: 2 },
            { key: 4, value: 4 },
        ],
        comp,
    );

    multiMap1.insert(3, 3);
    multiMap2.insert(3, 3);
    multiMap3.insert(1, 1);
    multiMap4.insert(5, 5);

    expect(multiMap1.keys).toEqual([3]);
    expect(multiMap2.keys).toEqual([2, 3, 4]);
    expect(multiMap3.keys).toEqual([1, 2, 4]);
    expect(multiMap4.keys).toEqual([2, 4, 5]);
});

test("copyArray", () => {
    const src = [4, 5, 6];

    const array1 = [1, 2, 3];
    const array2 = [1, 2, 3];
    const array3 = [1, 2, 3];
    const array4 = [1, 2, 3];
    const array5 = [1, 2, 3];
    const array6 = [1, 2, 3];

    copyArray(src, 0, array1, array1.length, src.length);
    copyArray(src, 0, array2, array2.length, src.length - 1);
    copyArray(src, 0, array3, 0, src.length);
    copyArray(src, 0, array4, 0, src.length - 1);
    copyArray(src, 1, array5, 0, src.length - 1);
    copyArray(src, 1, array6, 1, src.length - 1);

    expect(array1).toEqual([1, 2, 3, 4, 5, 6]);
    expect(array2).toEqual([1, 2, 3, 4, 5]);
    expect(array3).toEqual([4, 5, 6]);
    expect(array4).toEqual([4, 5, 3]);
    expect(array5).toEqual([5, 6, 3]);
    expect(array6).toEqual([1, 5, 6]);
});

test("copyArrayReversed", () => {
    const src = [4, 5, 6];

    const array1 = [1, 2, 3];
    const array2 = [1, 2, 3];
    const array3 = [1, 2, 3];
    const array4 = [1, 2, 3];
    const array5 = [1, 2, 3];
    const array6 = [1, 2, 3];

    copyArrayReversed(src, 0, array1, array1.length, src.length);
    copyArrayReversed(src, 0, array2, array2.length, src.length - 1);
    copyArrayReversed(src, 0, array3, 0, src.length);
    copyArrayReversed(src, 0, array4, 0, src.length - 1);
    copyArrayReversed(src, 1, array5, 0, src.length - 1);
    copyArrayReversed(src, 1, array6, 1, src.length - 1);

    expect(array1).toEqual([1, 2, 3, 6, 5, 4]);
    expect(array2).toEqual([1, 2, 3, 5, 4]);
    expect(array3).toEqual([6, 5, 4]);
    expect(array4).toEqual([5, 4, 3]);
    expect(array5).toEqual([6, 5, 3]);
    expect(array6).toEqual([1, 6, 5]);
});
