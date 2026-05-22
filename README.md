# redGeometry

2D/3D geometry processing.

## Features

### Geometry

- Basic primitives and arithmetics (matrix, vector, quaternion, complex)
- Bezier curves (linear, quadratic, cubic, rational)
- Path operations (flatten, simplify, offset, dash, stroke, boolean clip)
- Mesh (monotonic partitioning, triangulation)
- Stable snap rounding

### Utility

- Data structures
- Seedable random generator
- Double word arithmetic types for unsigned integers and floating point numbers

## Goals

- High quality output and performance
- APIs that are easy to use/extend
- No external dependencies
- Rich annotations of internals (with references to original sources and ideas)

### Non-Goals

- Sacrifice a significant amount of readability/maintainability to maximize performance

## Development

Execute `pnpm install` to install/update the development environment and `pnpm run --filter redgeometry-app serve` to run the development server.

### Recommended tools

- Visual Studio Code
- Node.js 24.x or later
- pnpm 10.x

### Example `launch.json`

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Launch Chrome against localhost",
            "url": "http://127.0.0.1:5173",
            "webRoot": "${workspaceFolder}/packages/redgeometry-app/src"
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
