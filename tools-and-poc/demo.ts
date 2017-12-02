import {LocalFileSystem} from "kissfs";
import {HttpDriver} from '../src/empty-epsilon/driver';
import {executeDriverCommands, getMonitoredAddresses, monitorByAddress} from "../src/osc-bridge/game-monitor";
import {OscDriver} from "../src/osc/osc-driver";
import {UdpOptions} from "osc";
import {resolve} from 'path';
import {Observable} from "rxjs/Observable";

export type ServerOptions = Partial<Options> & {
    resources: string
}


export type Options = {
    eeHost: string;
    eePort: number;
    terminalsPort: number;
    oscOptions: UdpOptions;
}

const DEFAULT_OPTIONS: Options = {
    eeHost: 'localhost',
    eePort: 8081,
    terminalsPort: 8888,
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57121
    }
};

export async function main(optionsArg: ServerOptions) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    let eeServerUrl = `http://${options.eeHost}:${options.eePort}`;

    // FS drivers
    const fs: LocalFileSystem = await new LocalFileSystem(optionsArg.resources).init();
    const oscDriver = new OscDriver(options.oscOptions);
    const eeDriver = new HttpDriver(eeServerUrl);

    // wire game state to OSC
    const monitoredAddresses = await getMonitoredAddresses(fs);
    const pollRequests =   Observable.interval(500).switchMap<any, string>(_ => monitoredAddresses);
    monitorByAddress(pollRequests, eeDriver).subscribe(oscDriver.outbox);
    executeDriverCommands(oscDriver.inbox, eeDriver);

    oscDriver.open();

    console.log('pre ONLINE');

    await     eeDriver.command(`
_G.d = Script()
_G.d:setVariable("live_msg", "foo"):run("_daedalus_1.lua")

`, []);
    console.log('waiting');

    await new Promise(res => setTimeout(res, 1000));
    await     eeDriver.command(`
    
_G.d:setVariable("live_msg", "bar")

`, []);
    console.log('ONLINE');

}

main({
//require('./src/index').main({
    resources: resolve(__dirname, '../resources'),
    terminalsPort: 8888,
    eeHost: 'localhost',
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57122
    }
});
