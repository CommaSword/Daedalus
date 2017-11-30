export interface RetryPromiseOptions {
    interval: number;
    timeout: number;
}

export async function retry<T>(promiseProvider: () => (Promise<T> | T), {interval, timeout}: RetryPromiseOptions): Promise<T> {
    let aborted = false;
    let lastError: Error;
    return new Promise<T>(async (resolve, reject) => {
        setTimeout(() => {
            aborted = true;
            reject(lastError);
        }, timeout);
        while (!aborted) {
            try {
                const result = await promiseProvider();
                if (!aborted) {
                    return resolve(result);
                }
            } catch (e) {
                lastError = e;
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        reject(lastError);
    });
}
