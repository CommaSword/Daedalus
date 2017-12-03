export function print<T>(msg: string, val: () => Promise<T>) {
    return async () => {
        const v = await val();
        console.log(msg, v);
        return v;
    };
}
