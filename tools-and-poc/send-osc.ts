import {OscBundle, OscMessage, SenderInfo, UDPPort} from "osc";
import {Observable} from "rxjs";

const oscServer = new UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121,
    remotePort: 8888,
    // remoteAddress: "127.0.0.1",
    remoteAddress: "10.0.0.45",
    // metadata: true,
});

// Listen for incoming OSC bundles.
oscServer.on("bundle", function (bundle: OscBundle, timeTag: number, info: SenderInfo) {
    console.log("An OSC bundle just arrived for time tag", timeTag, ":", bundle);
    console.log("Remote info is: ", info);
});

// Listen for incoming OSC bundles.
oscServer.on("message", function (message: OscMessage, timeTag: number | undefined, info: SenderInfo) {
    console.log("An OSC message just arrived :", message);
    console.log("Remote info is: ", info);
});
oscServer.open();

Observable.interval(500).subscribe(i => {
    console.log(i);
    oscServer.send({
        address: '/hello',
        args: ['world', i]
        //          args: ['world', i]
    });
});
