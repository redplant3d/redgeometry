export type AnimationFrameCallback<T> = (time: number, target: T) => void;

type AnimationFrameCallbackContext<T> = {
    callback: AnimationFrameCallback<T>;
    requestHandle: number;
    provider: AnimationFrameProvider;
    target: T;
};

export class AnimationFrameContext<T> {
    private callbackContext: AnimationFrameCallbackContext<T>;

    public constructor(provider: AnimationFrameProvider, target: T, callback: AnimationFrameCallback<T>) {
        this.callbackContext = { provider, target, callback, requestHandle: 0 };
    }

    public startAnimation(): void {
        const ctx = this.callbackContext;

        if (ctx.requestHandle !== 0) {
            return;
        }

        const onAnimationFrame = (time: number): void => {
            ctx.callback(time, ctx.target);
            ctx.requestHandle = ctx.provider.requestAnimationFrame(onAnimationFrame);
        };

        ctx.requestHandle = ctx.provider.requestAnimationFrame(onAnimationFrame);
    }

    public stepAnimation(): void {
        const ctx = this.callbackContext;

        if (ctx.requestHandle !== 0) {
            return;
        }

        const onAnimationFrame = (time: number): void => {
            ctx.callback(time, ctx.target);
            ctx.requestHandle = 0;
        };

        ctx.requestHandle = ctx.provider.requestAnimationFrame(onAnimationFrame);
    }

    public stopAnimation(): void {
        const ctx = this.callbackContext;

        ctx.provider.cancelAnimationFrame(ctx.requestHandle);
        ctx.requestHandle = 0;
    }
}
