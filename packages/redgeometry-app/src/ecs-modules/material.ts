import type { ReadonlyColorRgba } from "../render/color.js";
import type { AssetId } from "./asset.js";

export type Material = {
    color: ReadonlyColorRgba;
};

export type MaterialComponent = {
    componentId: "material";
    handle: AssetId<Material>;
};
