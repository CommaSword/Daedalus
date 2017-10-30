import {OscMessage, UDPPort} from "osc";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {NextObserver} from "rxjs/Observer";


export class OscDriver {

    // TODO extract configuration to constructor
    private port = new UDPPort({
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57121,
        remoteAddress: "0.0.0.0",
        metadata: true,
    });


    private readonly subject = new Subject<OscMessage>();

    public readonly outbox: NextObserver<OscMessage> = this.subject;

    constructor() {
        this.subject.groupBy((msg: OscMessage) => msg.address)
            .mergeMap((o: Observable<OscMessage>) => {
                // o is an observable of all messages of the same address
                // this is the place to use distinctUntilKeyChanged('args', (args1, args2) => deepEqual(args1, args2))
                // and throttleTime
                return o;
            })
            .subscribe(this.port.send.bind(this.port));
    }
}
