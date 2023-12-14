export class Image2 {
    private buffer: ArrayBuffer;
    private height: number;
    private width: number;

    public constructor(width: number, height: number, buffer?: ArrayBuffer) {
        this.width = width;
        this.height = height;

        this.buffer = buffer ?? new ArrayBuffer(4 * width * height);
    }

    public fill(int32: number): void {
        const array = new Int32Array(this.buffer);
        array.fill(int32);
    }

    public getBuffer8(): Uint8Array {
        const length = 4 * this.width * this.height;
        return new Uint8Array(this.buffer, 0, length);
    }

    public getHeight(): number {
        return this.height;
    }

    public getWidth(): number {
        return this.width;
    }

    public magnify(scale: number): Image2 {
        const image = new Image2(this.width * scale, this.height * scale);

        const srcSize = this.width * this.height;
        const destSize = srcSize * scale * scale;

        const srcData = new Int32Array(this.buffer, 0, srcSize);
        const destData = new Int32Array(image.buffer, 0, destSize);

        let destIdx = 0;

        for (let h = 0; h < this.height; h++) {
            for (let s1 = 0; s1 < scale; s1++) {
                let srcIdx = h * this.width;

                for (let w = 0; w < this.width; w++) {
                    const src = srcData[srcIdx++];

                    for (let s2 = 0; s2 < scale; s2++) {
                        destData[destIdx++] = src;
                    }
                }
            }
        }

        return image;
    }

    public resize(width: number, height: number): void {
        if (this.width === width && this.height === height) {
            // Nothing to do
            return;
        }

        this.width = width;
        this.height = height;
        this.buffer = new ArrayBuffer(4 * width * height);
    }

    public toImageData(): ImageData | undefined {
        if (this.width !== 0 && this.height !== 0) {
            const len = 4 * this.width * this.height;
            const data = new Uint8ClampedArray(this.buffer, 0, len);

            return new ImageData(data, this.width, this.height);
        } else {
            return undefined;
        }
    }
}
