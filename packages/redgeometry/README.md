# redGeometry

2D/3D geometry processing.

## Usage

This package provides optimized bundles for CJS and ESM via `redgeometry` imports, including type declarations and source maps.

```typescript
import { Vector2, log } from "redgeometry";

const v = new Vector2(1, 2);
log.infoDebug("len = {}", v.len());
```

## Advanced

For certain debugging scenarios it might be useful to import the source files directly with `redgeometry/src/*` and enable debugging asserts which are not present in the CJS/ESM bundles. However, the consuming application may not be compatible with the sources because of different TypeScript versions and/or configuration. Although direct source imports are mostly supported by the package, they are not recommended for the general use case.

```typescript
/// <reference types="redgeometry/src/env" />
import { Vector2 } from "redgeometry/src/primitives/vector";
import { log } from "redgeometry/src/utility/debug";

const v = new Vector2(1, 2);
log.infoDebug("len = {}", v.len());
```

The behavior is controlled by global environment variables, which can be replaced at compile time, e.g. by esbuild with [defines](https://esbuild.github.io/api/#define):

```json
{
    "define": {
        "REDGEOMETRY_DEBUG": "false"
    }
}
```

Without identifier replacement, some code will fail with a `ReferenceError` (variable is not defined). However, the environment variables may also be defined at the top of the main file:

```typescript
globalThis.REDGEOMETRY_DEBUG = true;
```
