import * as Rx from 'rxjs/Rx';

export interface Query {
    path: string;
}

export interface LocationToExpression {
    getterExpression(location: string): string;
}

export interface RawDriver {
    getBuffered<T>(getter: string): Promise<T>;
}

export class Pulser {

    private hearBeatTimer: NodeJS.Timer;
    pulseInterval = 500;
    pulse: Rx.Observable<number> = new Rx.Observable<null>((subscriber: Rx.Subscriber<null>) => this.subscriber = subscriber).scan(count => count + 1, 0);
    private subscriber: Rx.Subscriber<null>;
    // gameDriver: RawDriver;
    // queriesList: Query[];
    // translator: LocationToExpression;

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
/*
    getData = () => {
        this.queriesList.forEach(async q => {
            const query = this.translator.getterExpression(q.path);
            await this.gameDriver.getBuffered(query);
        });
    };*/

}
