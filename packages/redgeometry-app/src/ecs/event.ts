import { throwError } from "redgeometry/src/utility/debug";
import type { WorldEvent, WorldEventId, WorldEventIdOf, WorldEventIdsOf, WorldEventUnion } from "./types.js";

type WorldEventJournalEntry = {
    event: WorldEvent;
};

export class WorldEventStorage {
    public eventJournalEntries: WorldEventJournalEntry[];

    public constructor() {
        this.eventJournalEntries = [];
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

    public getEventsUnion<T extends WorldEvent[]>(eventIds: WorldEventIdsOf<T>): WorldEventUnionIterator<T> {
        return new WorldEventUnionIterator(this.eventJournalEntries, eventIds);
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

export class WorldEventUnionIterator<T extends WorldEvent[]> {
    private currIdx: number;
    private eventIds: WorldEventId[];
    private eventJournalEntries: WorldEventJournalEntry[];

    public constructor(eventJournalEntries: WorldEventJournalEntry[], eventIds: WorldEventIdsOf<T>) {
        this.eventJournalEntries = eventJournalEntries;
        this.eventIds = eventIds;
        this.currIdx = -1;
    }

    public getEvent(): WorldEventUnion<T> {
        const currIdx = this.currIdx;

        if (currIdx < 0) {
            throwError("Invalid event entry '{}'", currIdx);
        }

        return this.eventJournalEntries[currIdx].event;
    }

    public next(): boolean {
        let nextIdx = this.currIdx + 1;

        while (nextIdx < this.eventJournalEntries.length) {
            const ev = this.eventJournalEntries[nextIdx].event;

            for (const id of this.eventIds) {
                if (ev.eventId === id) {
                    this.currIdx = nextIdx;
                    return true;
                }
            }

            nextIdx += 1;
        }

        return false;
    }

    public reset(): void {
        this.currIdx = -1;
    }

    public toArray(): WorldEventUnion<T>[] {
        const events: WorldEventUnion<T>[] = [];

        while (this.next()) {
            events.push(this.getEvent());
        }

        return events;
    }
}
