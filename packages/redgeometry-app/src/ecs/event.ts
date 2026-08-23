import { assert, throwError } from "redgeometry/src/internal/debug";
import type { WorldModuleId } from "./world.ts";

export type WorldEventId = string;
export type WorldEvent = { readonly eventId: WorldEventId };
export type WorldEventIdOf<T extends WorldEvent> = T["eventId"];

type WorldEventEntry = {
    events: WorldEvent[];
};

export class WorldEventStorage {
    public entries: Map<WorldEventId, WorldEventEntry>;

    public constructor() {
        this.entries = new Map();
    }

    public add(event: WorldEvent): void {
        const entry = this.entries.get(event.eventId);
        assert(entry !== undefined, "World event '{}' has not been registered in a world module", event.eventId);

        entry.events.push(event);
    }

    public addArray(events: WorldEvent[]): void {
        if (events.length === 0) {
            // Nothing to do
            return;
        }

        const eventId = events[0].eventId;

        const entry = this.entries.get(eventId);
        assert(entry !== undefined, "World event '{}' has not been registered in a world module", eventId);

        for (const event of events) {
            assert(event.eventId === eventId, "World event '{}' does not match '{}'", event.eventId, eventId);

            entry.events.push(event);
        }
    }

    public findLast(eventId: WorldEventId): WorldEvent | undefined {
        const entry = this.entries.get(eventId);
        assert(entry !== undefined, "World event '{}' is not available", eventId);

        const events = entry.events;
        const len = events.length;

        if (len === 0) {
            return undefined;
        }

        return events[len - 1];
    }

    public get(eventId: WorldEventId): WorldEventIterator<WorldEvent> {
        const entry = this.entries.get(eventId);
        assert(entry !== undefined, "World event '{}' is not available", eventId);

        return new WorldEventIterator(entry.events);
    }

    public register(eventId: WorldEventId, moduleId: WorldModuleId): void {
        assert(
            !this.entries.has(eventId),
            "World event '{}' is registered from world module '{}' but has already been registered",
            eventId,
            moduleId,
        );

        this.entries.set(eventId, { events: [] });
    }

    public require(eventId: WorldEventId, moduleId: WorldModuleId): void {
        assert(
            this.entries.has(eventId),
            "World event '{}' is required by world module '{}' but has not been registered",
            eventId,
            moduleId,
        );
    }

    public reset(): void {
        for (const entry of this.entries.values()) {
            if (entry.events.length > 0) {
                entry.events = [];
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
