import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

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
