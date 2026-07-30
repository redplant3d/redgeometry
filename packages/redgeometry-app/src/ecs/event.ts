import { assert, throwError } from "redgeometry/src/utility/debug";

export type WorldEventId = string;
export type WorldEvent = { readonly eventId: WorldEventId };
export type WorldEventIdOf<T extends WorldEvent> = T["eventId"];

type WorldEventEntry = {
    events: WorldEvent[];
};

export class WorldEventStorage {
    public eventEntries: Map<WorldEventId, WorldEventEntry>;

    public constructor() {
        this.eventEntries = new Map();
    }

    public add<T extends WorldEvent>(event: T): void {
        const eventEntry = this.eventEntries.get(event.eventId);
        assert(eventEntry !== undefined, "World event id '{}' is not registered", event.eventId);

        eventEntry.events.push(event);
    }

    public addArray<T extends WorldEvent[]>(eventArray: T): void {
        if (eventArray.length === 0) {
            // Nothing to do
            return;
        }

        const eventId = eventArray[0].eventId;

        const eventEntry = this.eventEntries.get(eventId);
        assert(eventEntry !== undefined, "World event id '{}' is not registered", eventId);

        for (const event of eventArray) {
            assert(event.eventId === eventId, "World event id '{}' does not match '{}'", event.eventId, eventId);

            eventEntry.events.push(event);
        }
    }

    public findLast<T extends WorldEvent>(eventId: WorldEventIdOf<T>): T | undefined {
        const eventEntry = this.eventEntries.get(eventId);
        assert(eventEntry !== undefined, "World event id '{}' is not available", eventId);

        const events = eventEntry.events;
        const len = events.length;

        if (len === 0) {
            return undefined;
        }

        return events[len - 1] as T;
    }

    public get<T extends WorldEvent>(eventId: WorldEventIdOf<T>): WorldEventIterator<T> {
        const eventEntry = this.eventEntries.get(eventId);
        assert(eventEntry !== undefined, "World event id '{}' is not available", eventId);

        const events = eventEntry.events as T[];

        return new WorldEventIterator(events);
    }

    public register(eventId: WorldEventId): void {
        const hasEvent = this.eventEntries.has(eventId);
        assert(!hasEvent, "World event id '{}' is already registered", eventId);

        this.eventEntries.set(eventId, { events: [] });
    }

    public require(eventId: WorldEventId): void {
        const hasEvent = this.eventEntries.has(eventId);
        assert(hasEvent, "World event id '{}' is required but missing", eventId);
    }

    public reset(): void {
        for (const entries of this.eventEntries.values()) {
            if (entries.events.length > 0) {
                entries.events = [];
            }
        }
    }
}

export class WorldEventIterator<T extends WorldEvent> {
    private currIdx: number;
    private events: ReadonlyArray<T>;

    public constructor(events: ReadonlyArray<T>) {
        this.events = events;

        this.currIdx = -1;
    }

    public getEvent(): T {
        const currIdx = this.currIdx;

        if (currIdx < 0) {
            throwError("Invalid event entry '{}'", currIdx);
        }

        return this.events[currIdx];
    }

    public next(): boolean {
        const nextIdx = this.currIdx + 1;

        if (nextIdx < this.events.length) {
            this.currIdx = nextIdx;
            return true;
        }

        return false;
    }

    public reset(): void {
        this.currIdx = -1;
    }

    public toArray(): ReadonlyArray<T> {
        return this.events.slice();
    }
}
