import type { EntityHierarchySelector } from "../ecs/storage-sparse.js";
import type { EntityId } from "../ecs/types.js";
import { World } from "../ecs/world.js";
import { Matrix4A } from "../primitives/matrix.js";
import { Point3 } from "../primitives/point.js";
import { Quaternion } from "../primitives/quaternion.js";
import { Vector3 } from "../primitives/vector.js";

export enum Visibility {
    Inherit,
    Show,
    Hide,
}

export type TransformComponent = {
    componentId: "transform";
    scale: Vector3;
    rotation: Quaternion;
    translation: Point3;
    visible: Visibility;
};

export type GlobalComponent = {
    componentId: "global";
    transform: Matrix4A;
    visible: Visibility;
};

export type TransformEntry = {
    entityId: EntityId;
    depth: number;
};

export function transformSystem(world: World): void {
    // Collect entity entries that have an updated transform component (implicit: or a new parent)
    const entriesChanged: TransformEntry[] = [];

    const hiearchySelector = world.createHierarchySelector();

    for (const entityId of world.getEntitiesChanged()) {
        const transform = world.getComponent<TransformComponent>(entityId, "transform");

        if (transform === undefined) {
            continue;
        }

        let global = world.getComponent<GlobalComponent>(entityId, "global");

        if (global === undefined) {
            global = {
                componentId: "global",
                transform: Matrix4A.createIdentity(),
                visible: Visibility.Inherit,
            };
            world.setComponent<GlobalComponent>(entityId, global);
        }

        hiearchySelector.select(entityId);

        // We have ensured that `entry` has a transform and a global component
        entriesChanged.push({
            entityId,
            depth: hiearchySelector.getDepth(),
        });

        iterateChildren(world, hiearchySelector, entriesChanged);
    }

    // Sort entries by parent depth to ensure that its parent global component is up-to-date
    entriesChanged.sort((e1, e2) => e1.depth - e2.depth);

    for (const entry of entriesChanged) {
        const global = world.getComponent<GlobalComponent>(entry.entityId, "global");
        const local = world.getComponent<TransformComponent>(entry.entityId, "transform");

        if (global === undefined || local === undefined) {
            continue;
        }

        hiearchySelector.select(entry.entityId);

        const parent = hiearchySelector.getParent();

        if (parent !== undefined) {
            const parentGlobal = world.getComponent<GlobalComponent>(parent, "global");

            if (parentGlobal === undefined) {
                continue;
            }

            global.transform.copyFrom(parentGlobal.transform);

            if (local.visible === Visibility.Inherit) {
                global.visible = parentGlobal.visible;
            } else {
                global.visible = local.visible;
            }
        } else {
            global.transform.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0);
            global.visible = local.visible;
        }

        const t = local.translation;
        if (!t.eq(Point3.ZERO)) {
            global.transform.translatePre(t.x, t.y, t.z);
        }

        const r = local.rotation;
        if (!r.eq(Quaternion.IDENTITY)) {
            global.transform.rotatePre(r.a, r.b, r.c, r.d);
        }

        const s = local.scale;
        if (!s.eq(Vector3.ONE)) {
            global.transform.scalePre(s.x, s.y, s.z);
        }

        world.updateComponent<GlobalComponent>(entry.entityId, "global");
    }
}

function iterateChildren(
    world: World,
    hiearchySelector: EntityHierarchySelector,
    entriesChanged: TransformEntry[],
): void {
    const children = hiearchySelector.getChildren();

    if (children === undefined) {
        return;
    }

    for (const entityId of children) {
        const transform = world.getComponent<TransformComponent>(entityId, "transform");

        if (transform !== undefined) {
            entriesChanged.push({
                entityId,
                depth: hiearchySelector.getDepth(),
            });
        }

        hiearchySelector.select(entityId);

        iterateChildren(world, hiearchySelector, entriesChanged);
    }
}
