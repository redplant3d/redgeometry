import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function createDir(path: string): void {
    if (!existsSync(path)) {
        mkdirSync(path);
    }
}

export function joinPaths(...paths: string[]): string {
    return join(...paths);
}

export function removeDir(path: string): void {
    if (existsSync(path)) {
        rmSync(path, { recursive: true });
    }
}

export function writeFile(path: string, data: string): void {
    if (existsSync(path)) {
        rmSync(path);
    }

    writeFileSync(path, data);
}
