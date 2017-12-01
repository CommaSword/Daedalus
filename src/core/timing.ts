import {Observable, Subscriber} from "rxjs";
import Timer = NodeJS.Timer;

export class Pulser {

    pulseInterval = 500;
    private hearBeatTimer: NodeJS.Timer;
    private subscriber: Subscriber<null>;
    pulse: Observable<number> = new Observable<null>((subscriber: Subscriber<null>) => this.subscriber = subscriber).map((_, i: number) => i);
    private hearBeat = () => {
        this.subscriber.next(null);
        this.hearBeatTimer = setTimeout(this.hearBeat, this.pulseInterval)
    };

    start() {
        // kickstart the heartbeats
        this.hearBeat();
    }

    stop() {
        // kill the heartbeats
        clearTimeout(this.hearBeatTimer);
        this.subscriber.complete();
    }
}

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
