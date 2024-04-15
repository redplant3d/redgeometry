import { assertDebug, log, throwError } from "redgeometry/src/utility/debug";
import {
    LocalAppRemote,
    WebAppRemoteChild,
    WebAppRemoteParent,
    WorldChannelLocal,
    WorldChannelRemote,
    WorldGroup,
    type AppMessageRequestData,
    type AppMessageRequestFn,
    type AppMessageResponseData,
    type AppMessageResponseFn,
    type WorldGroupChild,
    type WorldGroupParent,
} from "../utility/ecs-app.js";
import type {
    DefaultSystemStage,
    DefaultWorldScheduleId,
    SystemStage,
    WorldGroupId,
    WorldId,
    WorldModule,
    WorldScheduleId,
} from "./types.js";
import { World, type WorldScheduleOptions } from "./world.js";

export type WorldOptions<
    T extends WorldScheduleId = DefaultWorldScheduleId,
    U extends SystemStage = DefaultSystemStage,
> = {
    id: WorldId;
    modules: WorldModule[];
    schedules: WorldScheduleOptions<T, U>[];
};

export type WorldGroupOptions = {
    id: WorldGroupId;
    parent: WorldGroupId | undefined;
    worlds: WorldOptions<WorldScheduleId, SystemStage>[];
    workerScriptURL?: URL | string;
};

export interface AppContext {
    readonly isMain: boolean;
    readonly isWorker: boolean;
    readonly selfName: string | undefined;

    createRemoteChild(
        requestSenderId: WorldGroupId,
        requestReceiverId: WorldGroupId,
        scriptURL: URL | string | undefined,
    ): AppRemoteChild;
    createRemoteParent(responseSenderId: WorldGroupId, responseReceiverId: WorldGroupId): AppRemoteParent;
    isValidGroup(groupOptions: WorldGroupOptions): boolean;
}

export interface AppRemoteChild {
    readonly requestReceiverId: WorldGroupId;
    readonly requestSenderId: WorldGroupId;

    sendRequest(data: AppMessageRequestData, transfer: Transferable[]): void;
    sendRequestAsync(data: AppMessageRequestData, transfer: Transferable[]): Promise<void>;
    setReceiveResponseFn(fn: AppMessageResponseFn): void;
}

export interface AppRemoteParent {
    readonly responseReceiverId: WorldGroupId;
    readonly responseSenderId: WorldGroupId;

    sendResponse(requestMessageId: number, data: AppMessageResponseData[], transfer: Transferable[]): void;
    setReceiveRequestFn(fn: AppMessageRequestFn): void;
}

export class App {
    private context: AppContext;
    private groupMap: Map<WorldGroupId, WorldGroup>;
    private groupOptionsMap: Map<WorldGroupId, WorldGroupOptions>;

    public constructor(context: AppContext) {
        this.context = context;

        this.groupOptionsMap = new Map();
        this.groupMap = new Map();
    }

    public addWorldGroup(options: WorldGroupOptions): void {
        const { id, parent } = options;

        if (parent !== undefined && !this.groupOptionsMap.has(parent)) {
            throwError("Unable to find parent '{}'", parent);
        }

        if (this.groupOptionsMap.has(id)) {
            log.warn("Group '{}' will be overwritten", id);
        }

        this.groupOptionsMap.set(id, options);
    }

    public run<T extends WorldScheduleId>(worldId: WorldId, scheduleId: T): void {
        const { context } = this;

        // Create world groups
        for (const groupOptions of this.groupOptionsMap.values()) {
            if (!context.isValidGroup(groupOptions)) {
                continue;
            }

            const channels = this.createChannels(context, groupOptions);
            const children = this.createChildren(context, groupOptions);
            const parent = this.createParent(context, groupOptions);

            const group = new WorldGroup(groupOptions.id, context, channels, children, parent);
            group.init();

            this.groupMap.set(groupOptions.id, group);
        }

        // Run startup world
        for (const group of this.groupMap.values()) {
            const channel = group.channelMap.get(worldId);

            if (channel !== undefined) {
                channel.world.runSchedule(scheduleId);
            }
        }
    }

    private createChannels(context: AppContext, groupOptions: WorldGroupOptions): Map<WorldId, WorldChannelLocal> {
        const channels = new Map<WorldId, WorldChannelLocal>();

        for (const worldOptions of groupOptions.worlds) {
            log.infoDebug("{} >> Created local world '{}'", groupOptions.id, worldOptions.id);

            const world = new World();
            world.addModules(worldOptions.modules);
            world.addSchedules(worldOptions.schedules);
            world.init();

            const channel = new WorldChannelLocal(worldOptions.id, world);
            channels.set(worldOptions.id, channel);
        }

        return channels;
    }

    private createChildren(context: AppContext, groupOptions: WorldGroupOptions): WorldGroupChild[] {
        const children: WorldGroupChild[] = [];

        for (const childGroupOptions of this.groupOptionsMap.values()) {
            if (childGroupOptions.parent !== groupOptions.id) {
                continue;
            }

            const remote = context.createRemoteChild(
                groupOptions.id,
                childGroupOptions.id,
                childGroupOptions.workerScriptURL,
            );
            const channelMap = new Map<WorldId, WorldChannelRemote>();

            for (const worldOptions of childGroupOptions.worlds) {
                const channelRemote = new WorldChannelRemote(worldOptions.id, remote);
                channelMap.set(worldOptions.id, channelRemote);
            }

            children.push({ remote, channelMap });
        }

        return children;
    }

    private createParent(context: AppContext, groupOptions: WorldGroupOptions): WorldGroupParent | undefined {
        if (groupOptions.parent === undefined) {
            return undefined;
        }

        const parentGroupOption = this.groupOptionsMap.get(groupOptions.parent);
        assertDebug(parentGroupOption !== undefined);

        const remote = context.createRemoteParent(groupOptions.id, parentGroupOption.id);
        const channelMap = new Map<WorldId, WorldChannelRemote>();

        for (const worldOptions of parentGroupOption.worlds) {
            const channelRemote = new WorldChannelRemote(worldOptions.id, undefined);
            channelMap.set(worldOptions.id, channelRemote);
        }

        return { remote, channelMap };
    }
}

export class LocalAppContext implements AppContext {
    private map: Map<WorldGroupId, LocalAppRemote>;

    public readonly isMain: boolean;
    public readonly isWorker: boolean;
    public readonly selfName: string | undefined;

    public constructor() {
        const isMain = typeof window !== "undefined";
        const isWorker = !isMain;
        const selfName = isWorker ? self.name : undefined;

        this.isMain = isMain;
        this.isWorker = isWorker;
        this.selfName = selfName;

        this.map = new Map();
    }

    public createRemoteChild(
        requestSenderId: WorldGroupId,
        requestReceiverId: WorldGroupId,
        _scriptURL: URL | string | undefined,
    ): AppRemoteChild {
        const remote = new LocalAppRemote(requestSenderId, requestReceiverId);
        this.map.set(requestReceiverId, remote);
        return remote;
    }

    public createRemoteParent(responseSenderId: WorldGroupId, _responseReceiverId: WorldGroupId): AppRemoteParent {
        const parentRemote = this.map.get(responseSenderId);

        if (parentRemote === undefined) {
            throwError("Unable to find parent remote");
        }

        return parentRemote;
    }

    public isValidGroup(_groupOptions: WorldGroupOptions): boolean {
        return true;
    }
}

export class WebAppContext implements AppContext {
    private defaultScriptURL: string | URL;

    public readonly isMain: boolean;
    public readonly isWorker: boolean;
    public readonly selfName: string | undefined;

    public constructor(defaultScriptURL: string | URL) {
        this.defaultScriptURL = defaultScriptURL;

        const isMain = typeof window !== "undefined";
        const isWorker = !isMain;
        const selfName = isWorker ? self.name : undefined;

        this.isMain = isMain;
        this.isWorker = isWorker;
        this.selfName = selfName;
    }

    public createRemoteChild(
        requestSenderId: WorldGroupId,
        requestReceiverId: WorldGroupId,
        scriptURL: URL | string | undefined,
    ): AppRemoteChild {
        return new WebAppRemoteChild(requestSenderId, requestReceiverId, scriptURL ?? this.defaultScriptURL);
    }

    public createRemoteParent(responseSenderId: WorldGroupId, responseReceiverId: WorldGroupId): AppRemoteParent {
        return new WebAppRemoteParent(responseSenderId, responseReceiverId);
    }

    public isValidGroup(groupOptions: WorldGroupOptions): boolean {
        const workerName = groupOptions.id;

        if (this.selfName === workerName) {
            return true;
        }

        if (this.selfName === undefined && groupOptions.parent === undefined) {
            return true;
        }

        return false;
    }
}
