import * as fugazi from "@fugazi/connector";
import {LocalFileSystem} from "kissfs";
import initExcalibur from "./excalibur/commands";
import initLogin from "./session/commands";
import initLog from "./log/commands";
import {parse} from "path";
import {Users} from "./session/users";
import {Entries} from "./excalibur/entries";
import {Logs} from "./log/logs";
import {HttpDriver} from './empty-epsilon/driver';
import {Pulser} from "./core/timing";
import {loadOscEeApi} from "./osc-bridge/game-monitor";
import {OscDriver} from "./osc/osc-driver";
import {UdpOptions} from "osc";
import resolve = require("resolve");

export type ServerOptions = Partial<Options> & {
    resources: string
}

async function initFugaziServices(fs: LocalFileSystem) {
// application BL modules
    const users = new Users(fs);
    const entries = new Entries(fs);
    await entries.init();
    const logs = new Logs(fs);

    // connector API
    const builder = new fugazi.ConnectorBuilder();
    builder.server()
    //	.host('0.0.0.0')
        .folder(parse(resolve.sync('@fugazi/webclient/index.html')).dir)
        .session({keygrip: ['abracadabra!']});

    initExcalibur(builder.module("excalibur"), entries);
    initLogin(builder.module("session"), users);
    initLog(builder.module("log"), logs);
    const connector = builder.build();

    // bootstrap connector
    await connector.start();
    // connector.logger.info("started");
}

async function runServer(options: Options, fs: LocalFileSystem) {
    const oscDriver = new OscDriver(options.oscOptions);
    const pulser = new Pulser();
    const eeDriver = new HttpDriver(`http://${options.eeHost}:${options.eePort}`);

    // wire game state to OSC
    await loadOscEeApi(fs, pulser.pulse, eeDriver, oscDriver);

    oscDriver.open();
    pulser.start();

}

export async function main(optionsArg: ServerOptions) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    const fs: LocalFileSystem = await (new LocalFileSystem(optionsArg.resources)).init();

    await runServer(options, fs);
    await initFugaziServices(fs);
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
