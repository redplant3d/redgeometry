import type { ColorRgba } from "redgeometry/src/primitives/color";
import type { AssetId } from "./asset.js";

export type Material = {
    color: ColorRgba;
};

export type MaterialComponent = {
    componentId: "material";
    handle: AssetId<Material>;
};
