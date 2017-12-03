import {UDPPort} from "osc";
import {Observable} from "rxjs";

it('pulse', (_neverDie) => {

    const oscServer = new UDPPort({
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 8000,
        remoteAddress: "0.0.0.0",
           metadata:true,
    });
    oscServer.open();

    const oscServer2 = new UDPPort({
        localAddress: "0.0.0.0",
        localPort: 57122,
        remotePort: 8002,
        remoteAddress: "0.0.0.0",
        metadata:true,
    });
    oscServer2.open();
    oscServer2.close();

    // const oscServer3 = new UDPPort({
    //     localAddress: "0.0.0.0",
    //     localPort: 57123,
    //     remotePort: 8003,
    //     remoteAddress: "0.0.0.0",
    //     metadata:true,
    // });
    // oscServer3.open();


    Observable.interval(500).subscribe(i => {
        console.log(i);
        oscServer.send({
            address: '/hello',
           args: [{type: 's', value: 'world'}, {type: 'i', value: i}]
          //          args: ['world', i]
        });
    });
}).timeout(2 * 1000);
