# redGeometry

2D/3D geometry processing.

## Features

### Geometry

-   Basic primitives and arithmetics (point, vector, matrix)
-   Bezier curves (linear, quadratic, cubic, rational)
-   Path operations (flatten, simplify, offset, dash, stroke, boolean clip)
-   Mesh (monotonic partitioning, triangulation)
-   Stable snap rounding

### Rendering

-   2D context similar to HTML canvas (software rasterizer)

### Utility

-   Data structures (sorted array, hash map)
-   Seedable random generator
-   Double word arithmetic types for unsigned integers and floating point numbers

## Goals

-   High quality output and performance
-   APIs that are easy to use/extend
-   No external dependencies
-   Rich annotations of internals (with references to original sources and ideas)

### Non-Goals

-   Sacrifice readability/maintainability to achieve the highest possible performance
-   Become an extensive 2D/3D graphics engine

## Development

Execute `npm run init` to install/update the development environment and `npm run serve -w redgeometry-app` to run the development server.

### Recommended tools

-   Visual Studio Code
-   Node.js 18.x or later

### Example `launch.json`

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Launch Chrome against localhost",
            "url": "http://127.0.0.1:8001",
            "webRoot": "${workspaceFolder}/packages/redgeometry-app/dist"
        }
    ]
}
```

### Example `settings.json`

```json
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "npm.packageManager": "pnpm"
}
```
