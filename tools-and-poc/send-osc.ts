import {UDPPort} from "osc";
import {Pulser} from "../src/core/pulser";

it('pulse', (_neverDie) => {

    const oscServer = new UDPPort({
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 8000,
        remoteAddress: "0.0.0.0",
           metadata:true,
    });
    oscServer.open();

    const p = new Pulser();

    p.pulse.subscribe(i => {
        console.log(i);
        oscServer.send({
            address: '/hello',
           args: [{type: 's', value: 'world'}, {type: 'i', value: i}]
          //          args: ['world', i]
        });
    });
    p.start();
});
