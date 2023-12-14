import type { KeyValue } from "./types.js";

const hashViewBuffer = new ArrayBuffer(8);
const hashF64 = new Float64Array(hashViewBuffer);
const hashI32 = new Int32Array(hashViewBuffer);

export interface Hashable {
    eq(value: this): boolean;
    hash(): number;
}

export class Hash {
    public static cantorPairing(x: number, y: number): number {
        // Note: Only unique for positive integer numbers
        return 0.5 * (x + y) * (x + y + 1) + y;
    }

    public static fromNumbers(...numbers: number[]): number {
        let hash = 0;

        for (let i = 0; i < numbers.length; i++) {
            hashF64[0] = numbers[i];
            hash ^= hashI32[0];
            hash ^= hashI32[1];
        }

        return hash >>> 0;
    }

    public static fromString(str: string): number {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            // Implementation of Java's String.hashCode()
            hash = (hash << 5) - hash;
            hash = (hash + str.charCodeAt(i)) | 0;
        }

        return hash;
    }

    public static rotateLeft(value: number, n: number): number {
        // JS integer values are 32-bit
        n &= 31;
        return (value << n) | (value >>> (32 - n));
    }

    public static rotateRight(value: number, n: number): number {
        // JS integer values are 32-bit
        n &= 31;
        return (value >>> n) | (value << (32 - n));
    }
}

type HashBucket<K extends Hashable, V> = {
    entries: KeyValue<K, V>[];
};

export class HashMap<K extends Hashable, V> {
    private buckets: HashBucket<K, V>[];

    public constructor(capacity?: number) {
        this.buckets = this.createBuckets(capacity ?? 1024);
    }

    public capacity(): number {
        return this.buckets.length;
    }

    public delete(key: K): boolean {
        const entries = this.getBucketEntries(key);

        for (let idx = 0; idx < entries.length; idx++) {
            const entry = entries[idx];
            if (key.eq(entry.key)) {
                entries.splice(idx, 1);
                return true;
            }
        }

        return false;
    }

    public get(key: K): V | undefined {
        const entries = this.getBucketEntries(key);

        for (let idx = 0; idx < entries.length; idx++) {
            const entry = entries[idx];
            if (key.eq(entry.key)) {
                return entry.value;
            }
        }

        return undefined;
    }

    public has(key: K): boolean {
        const entries = this.getBucketEntries(key);

        for (let idx = 0; idx < entries.length; idx++) {
            const entry = entries[idx];
            if (key.eq(entry.key)) {
                return true;
            }
        }

        return false;
    }

    public set(key: K, value: V): void {
        const entries = this.getBucketEntries(key);

        for (let idx = 0; idx < entries.length; idx++) {
            const entry = entries[idx];
            if (key.eq(entry.key)) {
                entry.value = value;
                return;
            }
        }

        entries.push({ key, value });
    }

    private createBuckets(capacity: number): HashBucket<K, V>[] {
        const buckets: HashBucket<K, V>[] = [];

        for (let i = 0; i < capacity; i++) {
            buckets.push({ entries: [] });
        }

        return buckets;
    }

    private getBucketEntries(key: K): KeyValue<K, V>[] {
        const idx = key.hash() % this.capacity();
        const bucket = this.buckets[idx];

        return bucket.entries;
    }

    private resizeBuckets(capacity: number): void {
        const newBuckets = this.createBuckets(capacity);
        const oldBuckets = this.buckets;

        this.buckets = newBuckets;

        for (const bucket of oldBuckets) {
            for (const entry of bucket.entries) {
                this.set(entry.key, entry.value);
            }
        }
    }
}
