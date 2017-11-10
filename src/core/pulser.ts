import {Observable, Subscriber} from "rxjs";

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
