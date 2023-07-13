import type { Component, Components, ComponentsTypeOf, TypedComponents } from "./types.js";

/**
 * Helper function to validate component types.
 */
export function hasComponentTypes<T extends Component[]>(
    components: Components,
    types: ComponentsTypeOf<T>,
): components is TypedComponents<T> {
    return types.every((t) => t in components);
}
