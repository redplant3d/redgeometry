import { Matrix4A } from "redgeometry/src/primitives/matrix";
import { Point3 } from "redgeometry/src/primitives/point";
import { Quaternion } from "redgeometry/src/primitives/quaternion";
import { Vector3 } from "redgeometry/src/primitives/vector";
import type { EntityId } from "../ecs/types.js";
import type { EntityHierarchySelector, World } from "../ecs/world.js";

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

export type ComputedTransformComponent = {
    componentId: "computed-transform";
    global: Matrix4A;
    visible: Visibility;
};

type TransformEntry = {
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

        let computedTransform = world.getComponent<ComputedTransformComponent>(entityId, "computed-transform");

        if (computedTransform === undefined) {
            computedTransform = {
                componentId: "computed-transform",
                global: Matrix4A.createIdentity(),
                visible: Visibility.Inherit,
            };
            world.setComponent<ComputedTransformComponent>(entityId, computedTransform);
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
        const transform = world.getComponent<TransformComponent>(entry.entityId, "transform");
        const computed = world.getComponent<ComputedTransformComponent>(entry.entityId, "computed-transform");

        if (transform === undefined || computed === undefined) {
            continue;
        }

        hiearchySelector.select(entry.entityId);

        const parent = hiearchySelector.getParent();

        if (parent !== undefined) {
            const parentComputed = world.getComponent<ComputedTransformComponent>(parent, "computed-transform");

            if (parentComputed === undefined) {
                continue;
            }

            computed.global.copyFromMat4A(parentComputed.global);

            if (transform.visible === Visibility.Inherit) {
                computed.visible = parentComputed.visible;
            } else {
                computed.visible = transform.visible;
            }
        } else {
            computed.global.set(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0);
            computed.visible = transform.visible;
        }

        const t = transform.translation;
        if (!t.isZero()) {
            computed.global.translatePre(t.x, t.y, t.z);
        }

        const r = transform.rotation;
        if (!r.isIdentity()) {
            computed.global.rotatePre(r.a, r.b, r.c, r.d);
        }

        const s = transform.scale;
        if (!s.isOne()) {
            computed.global.scalePre(s.x, s.y, s.z);
        }

        world.updateComponent<ComputedTransformComponent>(entry.entityId, "computed-transform");
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
