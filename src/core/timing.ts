import Timer = NodeJS.Timer;

export function setTimedInterval(tick: (delta: number) => void, interval: number): Timer {
    const start = process.hrtime();
    let lastMillisFromStart = 0;
    return setInterval(() => {
        const fullDelta = process.hrtime(start);
        const millisFromStart = (fullDelta[0] + (fullDelta[1] / 1e9)) * 1000;
        const delta = millisFromStart - lastMillisFromStart;
        lastMillisFromStart = millisFromStart;
        tick(delta);
    }, interval);
}
