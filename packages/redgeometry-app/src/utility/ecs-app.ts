import { throwError } from "redgeometry/src/utility/debug";
import type { AppContext, AppRemoteChild, AppRemoteParent } from "../ecs/app.js";
import type { WorldData, WorldEvent, WorldGroupId, WorldId, WorldScheduleId } from "../ecs/types.js";
import type { World, WorldChannel } from "../ecs/world.js";

export type AppMessageRequestData = {
    worldId: WorldId;
    dataBuffer: WorldData[];
    eventBuffer: WorldEvent[];
    scheduleId: WorldScheduleId;
};

export type AppMessageResponseData = {
    worldId: WorldId;
    dataBuffer: WorldData[];
    eventBuffer: WorldEvent[];
};

export type AppMessageRequest = {
    type: "AppMessageRequest";
    data: AppMessageRequestData;
    messageId: number;
    senderId: WorldGroupId;
};

export type AppMessageResponse = {
    type: "AppMessageResponse";
    data: AppMessageResponseData[];
    messageId: number;
    senderId: WorldGroupId;
};

export type AppMessageRequestFn = (req: AppMessageRequest) => Promise<void>;
export type AppMessageResponseFn = (res: AppMessageResponse) => void;

export type WorldGroupChild = {
    remote: AppRemoteChild;
    channelMap: Map<WorldId, WorldChannelRemote>;
};

export type WorldGroupParent = {
    remote: AppRemoteParent;
    channelMap: Map<WorldId, WorldChannelRemote>;
};

export class WorldChannelLocal implements WorldChannel {
    public readonly world: World;
    public readonly worldId: WorldId;

    public constructor(worldId: WorldId, world: World) {
        this.worldId = worldId;
        this.world = world;
    }

    public applyBuffer(dataBuffer: WorldData[], eventBuffer: WorldEvent[]): void {
        const { world } = this;

        for (const data of dataBuffer) {
            world.writeData(data);
        }

        for (const event of eventBuffer) {
            world.writeEvent(event);
        }
    }

    public queueData<T extends WorldData>(data: T, _transfer?: Transferable[]): void {
        this.world.writeData(data);
    }

    public queueEvent<T extends WorldEvent>(event: T, _transfer?: Transferable[]): void {
        this.world.writeEvent(event);
    }

    public queueEvents<T extends WorldEvent>(events: T[], _transfer?: Transferable[]): void {
        this.world.writeEvents(events);
    }

    public queueSchedule<T extends WorldScheduleId>(scheduleId: T): void {
        this.executorAsync(scheduleId);
    }

    public runScheduleAsync<T extends WorldScheduleId>(scheduleId: T): Promise<void> {
        return this.executorAsync(scheduleId);
    }

    private async executorAsync<T extends WorldScheduleId>(scheduleId: T): Promise<void> {
        // Delay execution to continue as microtask
        await Promise.resolve();

        return this.world.runSchedule(scheduleId);
    }
}

export class WorldChannelRemote implements WorldChannel {
    public readonly remote: AppRemoteChild | undefined;
    public readonly worldId: WorldId;

    public dataBuffer: WorldData[];
    public eventBuffer: WorldEvent[];
    public transfer: Transferable[];

    public constructor(worldId: WorldId, remote: AppRemoteChild | undefined) {
        this.worldId = worldId;
        this.remote = remote;

        this.dataBuffer = [];
        this.eventBuffer = [];
        this.transfer = [];
    }

    public queueData<T extends WorldData>(data: T, transfer?: Transferable[]): void {
        this.dataBuffer.push(data);

        if (transfer !== undefined) {
            this.transfer.push(...transfer);
        }
    }

    public queueEvent<T extends WorldEvent>(event: T, transfer?: Transferable[]): void {
        this.eventBuffer.push(event);

        if (transfer !== undefined) {
            this.transfer.push(...transfer);
        }
    }

    public queueEvents<T extends WorldEvent>(events: T[], transfer?: Transferable[]): void {
        for (const ev of events) {
            this.eventBuffer.push(ev);
        }

        if (transfer !== undefined) {
            this.transfer.push(...transfer);
        }
    }

    public queueSchedule<T extends WorldScheduleId>(scheduleId: T): void {
        const { remote, worldId, dataBuffer, eventBuffer, transfer } = this;

        if (remote === undefined) {
            throwError("Unable to run stage for parent");
        }

        const data: AppMessageRequestData = { worldId, dataBuffer, eventBuffer, scheduleId };

        this.resetBuffer();

        remote.sendRequest(data, transfer);
    }

    public resetBuffer(): void {
        this.dataBuffer = [];
        this.eventBuffer = [];
        this.transfer = [];
    }

    public runScheduleAsync<T extends WorldScheduleId>(scheduleId: T): Promise<void> {
        const { remote, worldId, dataBuffer, eventBuffer, transfer } = this;

        if (remote === undefined) {
            throwError("Unable to run stage for parent");
        }

        const data: AppMessageRequestData = { worldId, dataBuffer, eventBuffer, scheduleId };

        this.resetBuffer();

        return remote.sendRequestAsync(data, transfer);
    }
}

export class WorldGroup {
    public readonly channelMap: Map<WorldId, WorldChannelLocal>;
    public readonly children: WorldGroupChild[];
    public readonly context: AppContext;
    public readonly id: WorldGroupId;
    public readonly parent: WorldGroupParent | undefined;

    public constructor(
        id: WorldGroupId,
        context: AppContext,
        channelMap: Map<WorldId, WorldChannelLocal>,
        children: WorldGroupChild[],
        parent: WorldGroupParent | undefined,
    ) {
        this.id = id;
        this.context = context;
        this.channelMap = channelMap;
        this.children = children;
        this.parent = parent;
    }

    public init(): void {
        const { channelMap, children, parent } = this;

        // Add channels to worlds
        for (const { world, worldId } of channelMap.values()) {
            for (const channel of channelMap.values()) {
                if (channel.worldId !== worldId) {
                    world.addChannel(channel.worldId, channel);
                }
            }

            for (const child of children) {
                for (const channel of child.channelMap.values()) {
                    world.addChannel(channel.worldId, channel);
                }
            }

            if (parent !== undefined) {
                for (const channel of parent.channelMap.values()) {
                    world.addChannel(channel.worldId, channel);
                }
            }
        }

        const resFn = this.receiveResponse.bind(this);
        const reqFn = this.receiveRequest.bind(this);

        // Add remote listeners
        for (const child of children) {
            child.remote.setReceiveResponseFn(resFn);
        }

        if (parent !== undefined) {
            parent.remote.setReceiveRequestFn(reqFn);
        }
    }

    private getChannel(worldId: WorldId): WorldChannelLocal {
        const channel = this.channelMap.get(worldId);

        if (channel === undefined) {
            throwError("Unable to find local world channel '{}'", worldId);
        }

        return channel;
    }

    private async receiveRequest(req: AppMessageRequest): Promise<void> {
        // log.infoDebug("{} >> Received request message from group '{}'", this.id, req.senderId);

        const { worldId, scheduleId, dataBuffer, eventBuffer } = req.data;

        const channel = this.getChannel(worldId);
        channel.applyBuffer(dataBuffer, eventBuffer);

        // Wait for all systems to finish before sending response
        await channel.world.runSchedule(scheduleId);

        this.sendResponse(req.messageId);
    }

    private receiveResponse(res: AppMessageResponse): void {
        // log.infoDebug("{} >> Received response message from group '{}'", this.id, res.senderId);

        for (const { worldId, dataBuffer, eventBuffer } of res.data) {
            const channel = this.getChannel(worldId);
            channel.applyBuffer(dataBuffer, eventBuffer);
        }
    }

    private sendResponse(reqMessageId: number): void {
        const { parent } = this;

        if (parent === undefined) {
            return;
        }

        const data: AppMessageResponseData[] = [];
        const transfer: Transferable[] = [];

        for (const channel of parent.channelMap.values()) {
            data.push({
                worldId: channel.worldId,
                dataBuffer: channel.dataBuffer,
                eventBuffer: channel.eventBuffer,
            });
            transfer.push(...channel.transfer);
            channel.resetBuffer();
        }

        parent.remote.sendResponse(reqMessageId, data, transfer);
    }
}

export interface WorkerRef {
    readonly name: string;

    addEventListener(
        type: string,
        listener: (this: WorkerRef, ev: MessageEvent) => unknown,
        options?: boolean | AddEventListenerOptions,
    ): void;
    close(): void;
    postMessage<T>(message: T, transfer: Transferable[]): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

export class LocalAppRemote implements AppRemoteChild, AppRemoteParent {
    private requestFn: AppMessageRequestFn;
    private responseFn: AppMessageResponseFn;

    public readonly requestReceiverId: WorldGroupId;
    public readonly requestSenderId: WorldGroupId;
    public readonly responseReceiverId: WorldGroupId;
    public readonly responseSenderId: WorldGroupId;

    public constructor(requestSenderId: WorldGroupId, requestReceiverId: WorldGroupId) {
        this.requestSenderId = requestSenderId;
        this.requestReceiverId = requestReceiverId;
        this.responseSenderId = requestReceiverId;
        this.responseReceiverId = requestSenderId;

        this.requestFn = async () => {};
        this.responseFn = () => {};
    }

    public sendRequest(data: AppMessageRequestData, transfer: Transferable[]): void {
        const message: AppMessageRequest = {
            type: "AppMessageRequest",
            data: structuredClone(data, { transfer }),
            messageId: 0,
            senderId: this.requestSenderId,
        };

        this.executorAsync(message);
    }

    public async sendRequestAsync(data: AppMessageRequestData, transfer: Transferable[]): Promise<void> {
        const message: AppMessageRequest = {
            type: "AppMessageRequest",
            data: structuredClone(data, { transfer }),
            messageId: 0,
            senderId: this.requestSenderId,
        };

        return this.executorAsync(message);
    }

    public sendResponse(requestMessageId: number, data: AppMessageResponseData[], transfer: Transferable[]): void {
        const message: AppMessageResponse = {
            type: "AppMessageResponse",
            data: structuredClone(data, { transfer }),
            messageId: requestMessageId,
            senderId: this.responseSenderId,
        };

        this.responseFn(message);
    }

    public setReceiveRequestFn(fn: AppMessageRequestFn): void {
        this.requestFn = fn;
    }

    public setReceiveResponseFn(fn: AppMessageResponseFn): void {
        this.responseFn = fn;
    }

    private async executorAsync(message: AppMessageRequest): Promise<void> {
        // Delay execution to continue as microtask
        await Promise.resolve();

        return this.requestFn(message);
    }
}

export class WebAppRemoteChild implements AppRemoteChild {
    private callbacks: Map<number, { resolve: (value: void) => void; reject: (reason?: unknown) => void }>;
    private currentMessageId: number;
    private worker: Worker;

    public readonly requestReceiverId: WorldGroupId;
    public readonly requestSenderId: WorldGroupId;

    public constructor(requestSenderId: WorldGroupId, requestReceiverId: WorldGroupId, scriptURL: URL | string) {
        this.requestSenderId = requestSenderId;
        this.requestReceiverId = requestReceiverId;

        this.callbacks = new Map();
        this.currentMessageId = 0;
        this.worker = new Worker(scriptURL, { name: requestReceiverId });
    }

    public sendRequest(data: AppMessageRequestData, transfer: Transferable[]): void {
        const message: AppMessageRequest = {
            type: "AppMessageRequest",
            data,
            messageId: this.currentMessageId,
            senderId: this.requestSenderId,
        };

        this.currentMessageId += 1;
        this.worker.postMessage(message, transfer);
    }

    public async sendRequestAsync(data: AppMessageRequestData, transfer: Transferable[]): Promise<void> {
        const message: AppMessageRequest = {
            type: "AppMessageRequest",
            data,
            messageId: this.currentMessageId,
            senderId: this.requestSenderId,
        };

        const promise = new Promise<void>((resolve, reject) => {
            this.callbacks.set(this.currentMessageId, { resolve, reject });
        });

        this.currentMessageId += 1;
        this.worker.postMessage(message, transfer);

        return promise;
    }

    public setReceiveResponseFn(resFn: AppMessageResponseFn): void {
        this.worker.addEventListener("message", (ev: MessageEvent<AppMessageResponse>) => {
            const { data } = ev;

            resFn(data);

            const callback = this.callbacks.get(data.messageId);

            if (callback === undefined) {
                return;
            }

            callback.resolve();

            this.callbacks.delete(data.messageId);
        });
    }
}

export class WebAppRemoteParent implements AppRemoteParent {
    private workerRef: WorkerRef;

    public readonly responseReceiverId: WorldGroupId;
    public readonly responseSenderId: WorldGroupId;

    public constructor(responseSenderId: WorldGroupId, responseReceiverId: WorldGroupId) {
        this.responseSenderId = responseSenderId;
        this.responseReceiverId = responseReceiverId;

        this.workerRef = self as WorkerRef;
    }

    public sendResponse(requestMessageId: number, data: AppMessageResponseData[], transfer: Transferable[]): void {
        const message: AppMessageResponse = {
            type: "AppMessageResponse",
            data,
            messageId: requestMessageId,
            senderId: this.responseSenderId,
        };

        this.workerRef.postMessage(message, transfer);
    }

    public setReceiveRequestFn(fn: AppMessageRequestFn): void {
        this.workerRef.addEventListener("message", (ev) => fn(ev.data));
    }
}
