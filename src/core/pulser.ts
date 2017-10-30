import * as Rx from 'rxjs/Rx';

export class Pulser {

    private hearBeatTimer: NodeJS.Timer;
    pulseInterval = 500;
    pulse: Rx.Observable<number> = new Rx.Observable<null>((subscriber: Rx.Subscriber<null>) => this.subscriber = subscriber).map((_, i:number) => i);
    private subscriber: Rx.Subscriber<null>;

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
