export class ObjectPool<T> {
    private clearFn: (obj: T) => void;
    private createFn: () => T;

    public objects: T[];

    constructor(createFn: () => T, clearFn: (obj: T) => void) {
        this.createFn = createFn;
        this.clearFn = clearFn;

        this.objects = [];
    }

    public clear(): void {
        this.objects = [];
    }

    public rent(): T {
        let obj = this.objects.pop();

        if (obj === undefined) {
            obj = this.createFn();
        }

        return obj;
    }

    public return(obj: T): void {
        this.clearFn(obj);
        this.objects.push(obj);
    }
}
