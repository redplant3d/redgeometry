# redGeometry

2D/3D geometry processing.

## Usage

This package provides optimized bundles for CJS and ESM via `redgeometry` imports, including type declarations and source maps.

```typescript
import { Vector2, log } from "redgeometry";

const v = new Vector2(1, 2);
log.info("length = {}", v.length);
```

## Advanced

For certain debugging scenarios it might be useful to import the source files directly with `redgeometry/src/*` and enable debugging asserts which are not present in the CJS/ESM bundles. However, the consuming application may not be compatible with the sources because of different TypeScript versions and/or configuration. Although direct source imports are largely supported by the package, they are not recommended for general usage.

```typescript
import { Vector2 } from "redgeometry/src/primitives/vector.js";
import { log } from "redgeometry/src/utility/debug.js";

const v = new Vector2(1, 2);
log.info("length = {}", v.length);
```
