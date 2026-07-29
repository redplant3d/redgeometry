import { assert, throwError } from "redgeometry/src/utility/debug";

export type WorldEventId = string;
export type WorldEvent = { readonly eventId: WorldEventId };
export type WorldEventIdOf<T extends WorldEvent> = T["eventId"];

type WorldEventJournalEntry = {
    event: WorldEvent;
};

export class WorldEventStorage {
    public eventJournalEntries: WorldEventJournalEntry[];
    private events: Set<WorldEventId>;

    public constructor() {
        this.eventJournalEntries = [];
        this.events = new Set();
    }

    public register(eventId: WorldEventId): void {
        const hasEvent = this.events.has(eventId);
        assert(!hasEvent, "World event id '{}' is already registered", eventId);

        this.events.add(eventId);
    }

    public require(eventId: WorldEventId): void {
        const hasEvent = this.events.has(eventId);
        assert(hasEvent, "World event id '{}' is required but missing", eventId);
    }

    public addEvent<T extends WorldEvent>(event: T): void {
        this.eventJournalEntries.push({
            event,
        });
    }

    public addEvents<T extends WorldEvent[]>(events: T): void {
        for (const ev of events) {
            this.addEvent(ev);
        }
    }

    public findLastEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): T | undefined {
        for (let i = this.eventJournalEntries.length - 1; i >= 0; i--) {
            const ev = this.eventJournalEntries[i].event;

            if (ev.eventId === eventId) {
                return ev as T;
            }
        }

        return undefined;
    }

    public getEvents<T extends WorldEvent>(eventId: WorldEventIdOf<T>): WorldEventIterator<T> {
        return new WorldEventIterator(this.eventJournalEntries, eventId);
    }

    public getEventsArray<T extends WorldEvent>(eventId: WorldEventIdOf<T>): T[] {
        const events: T[] = [];

        for (const entry of this.eventJournalEntries) {
            const ev = entry.event;

            if (ev.eventId === eventId) {
                events.push(ev as T);
            }
        }

        return events;
    }

    public hasEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): boolean {
        for (const entry of this.eventJournalEntries) {
            const ev = entry.event;

            if (ev.eventId === eventId) {
                return true;
            }
        }

        return false;
    }

    public reset(): void {
        if (this.eventJournalEntries.length > 0) {
            this.eventJournalEntries = [];
        }
    }
}

export class WorldEventIterator<T extends WorldEvent> {
    private currIdx: number;
    private eventId: WorldEventId;
    private eventJournalEntries: WorldEventJournalEntry[];

    public constructor(eventJournalEntries: WorldEventJournalEntry[], eventId: WorldEventIdOf<T>) {
        this.eventJournalEntries = eventJournalEntries;
        this.eventId = eventId;
        this.currIdx = -1;
    }

    public getEvent(): T {
        const currIdx = this.currIdx;

        if (currIdx < 0) {
            throwError("Invalid event entry '{}'", currIdx);
        }

        return this.eventJournalEntries[currIdx].event as T;
    }

    public next(): boolean {
        let nextIdx = this.currIdx + 1;

        while (nextIdx < this.eventJournalEntries.length) {
            const ev = this.eventJournalEntries[nextIdx].event;

            if (ev.eventId === this.eventId) {
                this.currIdx = nextIdx;
                return true;
            }

            nextIdx += 1;
        }

        return false;
    }

    public reset(): void {
        this.currIdx = -1;
    }

    public toArray(): T[] {
        const events: T[] = [];

        while (this.next()) {
            const ev = this.getEvent();
            events.push(ev);
        }

        return events;
    }
}
