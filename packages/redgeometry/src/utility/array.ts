import { assertDebug } from "./debug.js";
import type { KeyValue } from "./types.js";

/**
 * Multi set (multiple values) backed by an array.
 */
export class ArrayMultiSet<T> {
    private comp: (a: T, b: T) => number;
    private data: T[];

    constructor(compareFn: (a: T, b: T) => number) {
        this.comp = compareFn;
        this.data = [];
    }

    public get length(): number {
        return this.data.length;
    }

    public get values(): readonly T[] {
        return this.data;
    }

    public static fromArray<T>(array: T[], compareFn: (a: T, b: T) => number): ArrayMultiSet<T> {
        const multiSet = new ArrayMultiSet(compareFn);
        multiSet.data = array.slice().sort(compareFn);
        return multiSet;
    }

    public clear(): void {
        this.data = [];
    }

    public dequeue(): T | undefined {
        return this.data.shift();
    }

    public find(value: T): T | undefined {
        // Find the first occurrence of an equivalent value with binary search
        const idx = this.findIndex(value);
        return idx >= 0 ? this.data[idx] : undefined;
    }

    public findBy(predicate: (value: T) => boolean, start = 0): T | undefined {
        // Find the first occurrence of an equivalent value with a custom predicate and linear search
        for (let i = start; i < this.data.length; i++) {
            if (predicate(this.data[i])) {
                return this.data[i];
            }
        }
        return undefined;
    }

    public findIndex(value: T): number {
        // Find the first index occurrence of an equivalent value with binary search
        const data = this.data;
        const comp = this.comp;

        // Use linear search for small sizes
        if (data.length < 8) {
            for (let idx = 0; idx < data.length; idx++) {
                if (comp(value, data[idx]) === 0) {
                    return idx;
                }
            }
        } else {
            const idx = this.findIndexNearestStart(value);
            if (comp(value, data[idx]) === 0) {
                return idx;
            }
        }

        return -1;
    }

    public findIndexBy(predicate: (value: T) => boolean, start = 0): number {
        // Find the first index occurrence of an equivalent value with a custom predicate and linear search
        for (let i = start; i < this.data.length; i++) {
            if (predicate(this.data[i])) {
                return i;
            }
        }
        return -1;
    }

    public findIndexNearestEnd(value: T, start = 0): number {
        const data = this.data;
        const compareFn = this.comp;

        let low = start;
        let high = data.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (compareFn(value, data[mid]) < 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

    public findIndexNearestStart(value: T, start = 0): number {
        const data = this.data;
        const compareFn = this.comp;

        let low = start;
        let high = data.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (compareFn(value, data[mid]) <= 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

    public getAt(index: number): T {
        return this.data[index];
    }

    public insert(value: T): void {
        const idx = this.findIndexNearestEnd(value);
        this.data.splice(idx, 0, value);
    }

    public remove(value: T): boolean {
        const idx = this.findIndex(value);

        if (idx < 0) {
            return false;
        }

        this.removeAt(idx);
        return true;
    }

    public removeAt(index: number, length = 1): void {
        this.data.splice(index, length);
    }

    public removeBy(predicate: (value: T) => boolean, start = 0, length = 1): boolean {
        const idx = this.findIndexBy(predicate, start);

        if (idx < 0) {
            return false;
        }

        this.removeAt(idx, length);
        return true;
    }

    public removeRange(from: T, to?: T): number {
        const start = this.findIndexNearestStart(from);
        const end = this.findIndexNearestEnd(to ?? from, start);
        const length = end - start;

        this.removeAt(start, length);
        return length;
    }

    public toArray(): T[] {
        return this.data.slice();
    }
}

/**
 * Multi map with (multiple key-value pairs) backed by an array.
 */
export class ArrayMultiMap<K, V> {
    private compareFn: (a: K, b: K) => number;
    private data: KeyValue<K, V>[];

    constructor(compareFn: (a: K, b: K) => number) {
        this.compareFn = compareFn;
        this.data = [];
    }

    public get entries(): readonly KeyValue<K, V>[] {
        return this.data;
    }

    public get keys(): K[] {
        return this.data.map((d) => d.key);
    }

    public get length(): number {
        return this.data.length;
    }

    public get values(): V[] {
        return this.data.map((d) => d.value);
    }

    public static fromArray<K, V>(array: KeyValue<K, V>[], compareFn: (a: K, b: K) => number): ArrayMultiMap<K, V> {
        const multiMap = new ArrayMultiMap<K, V>(compareFn);
        multiMap.data = array.slice().sort((d1, d2) => compareFn(d1.key, d2.key));
        return multiMap;
    }

    public clear(): void {
        this.data = [];
    }

    public dequeue(): KeyValue<K, V> | undefined {
        return this.data.shift();
    }

    public find(key: K): V | undefined {
        // Find the first occurrence of an equivalent value with binary search
        const idx = this.findIndex(key);
        return idx >= 0 ? this.data[idx].value : undefined;
    }

    public findBy(predicate: (value: K) => boolean, start = 0): V | undefined {
        // Find the first occurrence of an equivalent value with a custom predicate and linear search
        for (let i = start; i < this.data.length; i++) {
            if (predicate(this.data[i].key)) {
                return this.data[i].value;
            }
        }
        return undefined;
    }

    public findIndex(key: K): number {
        // Find the first index occurrence of an equivalent value with binary search
        const data = this.data;
        const compareFn = this.compareFn;

        // Use linear search for small sizes
        if (data.length < 8) {
            for (let idx = 0; idx < data.length; idx++) {
                if (compareFn(key, data[idx].key) === 0) {
                    return idx;
                }
            }
        } else {
            const idx = this.findIndexNearestStart(key);
            if (compareFn(key, data[idx].key) === 0) {
                return idx;
            }
        }

        return -1;
    }

    public findIndexBy(predicate: (key: K) => boolean, start = 0): number {
        // Find the first index occurrence of an equivalent value with a custom predicate and linear search
        for (let i = start; i < this.data.length; i++) {
            if (predicate(this.data[i].key)) {
                return i;
            }
        }
        return -1;
    }

    public findIndexNearestEnd(key: K, start = 0): number {
        const data = this.data;
        const compareFn = this.compareFn;

        let low = start;
        let high = this.data.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (compareFn(key, data[mid].key) < 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

    public findIndexNearestStart(key: K, start = 0): number {
        const data = this.data;
        const compareFn = this.compareFn;

        let low = start;
        let high = data.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (compareFn(key, data[mid].key) <= 0) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

    public getValueAt(index: number): V {
        return this.data[index].value;
    }

    public insert(key: K, value: V): void {
        const idx = this.findIndexNearestEnd(key);
        this.data.splice(idx, 0, { key, value });
    }

    public remove(key: K): boolean {
        const idx = this.findIndex(key);

        if (idx < 0) {
            return false;
        }

        this.removeAt(idx);
        return true;
    }

    public removeAt(index: number, length = 1): void {
        this.data.splice(index, length);
    }

    public removeBy(predicate: (key: K) => boolean, start = 0, length = 1): boolean {
        const idx = this.findIndexBy(predicate, start);

        if (idx < 0) {
            return false;
        }

        this.removeAt(idx, length);
        return true;
    }

    public removeRange(from: K, to?: K): number {
        const start = this.findIndexNearestStart(from);
        const end = this.findIndexNearestEnd(to ?? from, start);
        const length = end - start;

        this.removeAt(start, length);
        return length;
    }

    public toArray(): KeyValue<K, V>[] {
        return this.data.slice();
    }
}

export function copyArray<T>(src: T[], srcStart: number, dest: T[], destStart: number, length: number): void {
    assertDebug(
        length <= src.length - srcStart,
        "Parameter 'length' must be smaller or equal to length of 'src' to avoid over-read"
    );

    const destEnd = destStart + length;

    if (destEnd > dest.length) {
        // `dest` needs to grow
        dest.length = destEnd;
    }

    let srcIdx = srcStart;
    let destIdx = destStart;

    while (destIdx < destEnd) {
        dest[destIdx++] = src[srcIdx++];
    }
}

export function copyArrayReversed<T>(src: T[], srcStart: number, dest: T[], destStart: number, length: number): void {
    assertDebug(
        length <= src.length - srcStart,
        "Parameter 'length' must be smaller or equal to length of 'src' to avoid over-read"
    );

    const destEnd = destStart + length;

    if (destEnd > dest.length) {
        // `dest` needs to grow
        dest.length = destEnd;
    }

    let srcIdx = srcStart + length - 1;
    let destIdx = destStart;

    while (destIdx < destEnd) {
        dest[destIdx++] = src[srcIdx--];
    }
}

/**
 * Checks `arr1` and `arr2` for shallow equality.
 */
export function arrayEquals<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1 === arr2) {
        return true;
    }

    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}
