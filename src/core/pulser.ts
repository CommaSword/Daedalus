import {Observable, Subscriber} from "rxjs/Rx";

export class Pulser {

    private hearBeatTimer: NodeJS.Timer;
    pulseInterval = 500;
    pulse: Observable<number> = new Observable<null>((subscriber: Subscriber<null>) => this.subscriber = subscriber).map((_, i:number) => i);
    private subscriber: Subscriber<null>;

    start() {
        // kickstart the heartbeats
        this.hearBeat();
    }

    private hearBeat = () => {
        this.subscriber.next(null);
        this.hearBeatTimer = setTimeout(this.hearBeat, this.pulseInterval)
    };

    stop() {
        // kill the heartbeats
        clearTimeout(this.hearBeatTimer);
        this.subscriber.complete();
    }
}
