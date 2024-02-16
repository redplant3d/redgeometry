import type { ColorRgba } from "../primitives/color.js";
import type { AssetId } from "./asset.js";

export type Material = {
    color: ColorRgba;
};

export type MaterialComponent = {
    componentId: "material";
    handle: AssetId<Material>;
};
