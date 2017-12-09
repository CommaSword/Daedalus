import {OscMessage, UdpOptions, UDPPort} from "osc";
import {Observable, Subject} from 'rxjs';
import {NextObserver} from "rxjs/Observer";
import {Subscription} from "rxjs";


export class OscDriver {
    private readonly subscription: Subscription;

    public readonly inbox: Observable<OscMessage>;
    private readonly port: UDPPort;
    private readonly subject = new Subject<OscMessage>();
    public readonly outbox: NextObserver<OscMessage> = this.subject;

    constructor(options: UdpOptions) {
        options = Object.assign({},
            {
                remoteAddress: "10.0.0.45",
                metadata: true
            }, options);
        this.port = new UDPPort(options);
        this.subscription = this.subject.groupBy((msg: OscMessage) => msg.address)
            .mergeMap((o: Observable<OscMessage>) => {
                // o is an observable of all messages of the same address
                // this is the place to use distinctUntilKeyChanged('args', (args1, args2) => deepEqual(args1, args2))
                // and throttleTime
                return o;
            })
            .subscribe(msg => this.port.send(msg));
        this.inbox = Observable.fromEvent(this.port, 'message');
        console.info(`OSC server listening on ${options.localAddress}:${options.localPort}, sending to ${options.remoteAddress}:${options.remotePort}`)
    }

    async open() {
        this.port.open();
        await new Promise(res => this.port.once('ready', res));
    }

    close() {
        this.subscription.unsubscribe();
        this.port.close();
    }
}
