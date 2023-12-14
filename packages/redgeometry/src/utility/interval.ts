export class Interval {
    public readonly a: number;
    public readonly b: number;

    public constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    public static fromUnordered(a: number, b: number): Interval {
        if (a <= b) {
            return new Interval(a, b);
        } else {
            return new Interval(b, a);
        }
    }

    public clamp(a: number, b: number): Interval {
        const min = Math.max(this.a, a);
        const max = Math.min(this.b, b);

        return new Interval(min, max);
    }

    public contains(value: number): boolean {
        return this.a < value && this.b > value;
    }

    public diameter(): number {
        return this.b - this.a;
    }

    public encloseInterval(i: Interval): Interval {
        const min = Math.min(this.a, i.a);
        const max = Math.max(this.b, i.b);

        return new Interval(min, max);
    }

    public encloseValue(value: number): Interval {
        const min = Math.min(this.a, value);
        const max = Math.max(this.b, value);

        return new Interval(min, max);
    }

    public intersects(i: Interval): boolean {
        return this.a < i.b && this.b > i.a;
    }

    public isDegenerate(): boolean {
        return this.a === this.b;
    }

    public isEmpty(): boolean {
        return this.a > this.b;
    }

    public mid(): number {
        return 0.5 * (this.a + this.b);
    }

    public widen(value: number): Interval {
        return new Interval(this.a - value, this.b + value);
    }

    public withEnd(b: number): Interval {
        return new Interval(this.a, b);
    }

    public withStart(a: number): Interval {
        return new Interval(a, this.b);
    }
}

export class IntervalSetEvent {
    public value: number;
    public weight: number;

    public constructor(value: number, weight: number) {
        this.value = value;
        this.weight = weight;
    }
}

export class IntervalSet {
    private sortedEvents: IntervalSetEvent[];

    public constructor() {
        this.sortedEvents = [];
    }

    public add(i: Interval, weight = 1): void {
        this.sortedInsert(i.a, weight);
        this.sortedInsert(i.b, -weight);
    }

    public clear(): void {
        this.sortedEvents = [];
    }

    public clipTo(i: Interval): void {
        const events: IntervalSetEvent[] = [];

        let wa = 0;
        let wb = 0;

        // Iterate events
        for (const e of this.sortedEvents) {
            if (e.value < i.a) {
                wa += e.weight;
            } else if (e.value > i.b) {
                wb += e.weight;
            } else {
                events.push(e);
            }
        }

        this.sortedEvents = events;

        // Insert new bounds
        this.sortedInsert(i.a, wa);
        this.sortedInsert(i.b, wb);
    }

    public getEvents(): readonly IntervalSetEvent[] {
        return this.sortedEvents;
    }

    public join(predicate: (w: number) => boolean): Interval[] {
        const intervals: Interval[] = [];

        let flag = false;
        let value = Number.NEGATIVE_INFINITY;
        let weight = 0;

        // Iterate events
        for (const e of this.sortedEvents) {
            weight += e.weight;

            if (predicate(weight) !== flag) {
                if (flag) {
                    intervals.push(new Interval(value, e.value));
                } else {
                    value = e.value;
                }

                flag = !flag;
            }
        }

        if (flag) {
            intervals.push(new Interval(value, Number.POSITIVE_INFINITY));
        }

        return intervals;
    }

    private sortedInsert(value: number, weight: number): void {
        let idx = 0;

        // Find index to insert
        while (idx < this.sortedEvents.length && this.sortedEvents[idx].value < value) {
            idx++;
        }

        this.sortedEvents.splice(idx, 0, new IntervalSetEvent(value, weight));
    }
}
