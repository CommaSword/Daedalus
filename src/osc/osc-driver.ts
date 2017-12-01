import {OscMessage, UdpOptions, UDPPort} from "osc";
import {Observable, Subject} from 'rxjs';
import {NextObserver} from "rxjs/Observer";


export class OscDriver {

    public readonly inbox: Observable<OscMessage>;
    private readonly port: UDPPort;
    private readonly subject = new Subject<OscMessage>();
    public readonly outbox: NextObserver<OscMessage> = this.subject;

    constructor(options: UdpOptions) {
        options = Object.assign({},
            {
                remoteAddress: "0.0.0.0",
                metadata: true
            }, options);
        this.port = new UDPPort(options);
        this.subject.groupBy((msg: OscMessage) => msg.address)
            .mergeMap((o: Observable<OscMessage>) => {
                // o is an observable of all messages of the same address
                // this is the place to use distinctUntilKeyChanged('args', (args1, args2) => deepEqual(args1, args2))
                // and throttleTime
                return o;
            })
            .subscribe(this.port.send.bind(this.port));
        this.inbox = Observable.fromEvent(this.port, 'message');
        console.info(`OSC server listening on ${options.localAddress}:${options.localPort}, sending to ${options.remoteAddress}:${options.remotePort}`)
    }

    async open() {
        this.port.open();
        await new Promise(res => this.port.once('ready', res));
    }

    close() {
        this.port.close();
    }
}
