import {OscMessage, UdpOptions, UDPPort} from "osc";
import {Observable, Subject} from 'rxjs';
import {NextObserver} from "rxjs/Observer";


export class OscDriver {

    public readonly inbox: Observable<OscMessage>;
    private readonly port: UDPPort;
    private readonly subject = new Subject<OscMessage>();
    public readonly outbox: NextObserver<OscMessage> = this.subject;

    constructor(options: UdpOptions) {
        this.port = new UDPPort(Object.assign({},
            options,
            {
                remoteAddress: "0.0.0.0",
                metadata: true
            }));
        this.subject.groupBy((msg: OscMessage) => msg.address)
            .mergeMap((o: Observable<OscMessage>) => {
                // o is an observable of all messages of the same address
                // this is the place to use distinctUntilKeyChanged('args', (args1, args2) => deepEqual(args1, args2))
                // and throttleTime
                return o;
            })
            .subscribe(this.port.send.bind(this.port));
        this.inbox = Observable.fromEvent(this.port, 'message');
    }

    open() {
        this.port.open();
    }

    close() {
        this.port.close();
    }
}
