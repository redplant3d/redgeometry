import { Matrix4A } from "redgeometry/src/primitives/matrix";
import { Point3 } from "redgeometry/src/primitives/point";
import { Quaternion } from "redgeometry/src/primitives/quaternion";
import { Vector3 } from "redgeometry/src/primitives/vector";
import type { EntityId } from "../ecs/types.js";
import type { World } from "../ecs/world.js";
import type { ComputedChildrenComponent, ParentComponent } from "./hierachy.js";

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
    const query = world.queryEntities<TransformComponent | ComputedTransformComponent>(
        (q) => q.hasComponent("transform") && !q.hasComponent("computed-transform"),
    );

    while (query.next()) {
        const entityId = query.getEntityId();
        const computedTransform: ComputedTransformComponent = {
            componentId: "computed-transform",
            global: Matrix4A.createIdentity(),
            visible: Visibility.Inherit,
        };

        world.setComponent<ComputedTransformComponent>(entityId, computedTransform);
    }

    const query2 = world.queryEntities<TransformComponent | ParentComponent | ComputedChildrenComponent>(
        (q) => q.hasComponent("transform") && q.isUpdated("parent"),
    );

    while (query2.next()) {
        const entityId = query2.getEntityId();
        world.updateComponent<TransformComponent>(entityId, "transform");

        const computedChildren = query2.findComponent<ComputedChildrenComponent>("computed-children");
        iterateChildren(world, computedChildren);
    }

    const query3 = world.queryEntities<TransformComponent | ComputedTransformComponent | ParentComponent>(
        (q) => q.isUpdated("transform") && q.hasComponent("computed-transform"),
    );

    while (query3.next()) {
        const transform = query3.getComponent<TransformComponent>("transform");
        const computed = query3.getComponent<ComputedTransformComponent>("computed-transform");
        const parent = query3.findComponent<ParentComponent>("parent");
        const entityId = query3.getEntityId();

        if (parent !== undefined) {
            const parentComputed = world.getComponent<ComputedTransformComponent>(parent.entity, "computed-transform");

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

        world.updateComponent<ComputedTransformComponent>(entityId, "computed-transform");
    }
}

function iterateChildren(world: World, computedChildren: ComputedChildrenComponent | undefined): void {
    if (computedChildren === undefined) {
        return;
    }

    for (const entityId of computedChildren.value) {
        world.updateComponent<TransformComponent>(entityId, "transform");

        const computedChildren = world.getComponent<ComputedChildrenComponent>(entityId, "computed-children");

        if (computedChildren !== undefined) {
            iterateChildren(world, computedChildren);
        }
    }
}
