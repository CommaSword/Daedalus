import * as fugazi from "@fugazi/connector";
import {Connector} from "@fugazi/connector";
import {FileSystem, LocalFileSystem} from "kissfs";
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

export class FugaziServices {
    private readonly logs: Logs;
    private readonly users: Users;
    private readonly entries: Entries;
    private readonly connector: Connector;

    constructor(private fs: FileSystem) {
        // application BL modules
        this.users = new Users(fs);
        this.entries = new Entries(fs);
        this.logs = new Logs(fs);

        // connector API
        const builder = new fugazi.ConnectorBuilder();
        builder.server()
        //	.host('0.0.0.0')
            .folder(parse(resolve.sync('@fugazi/webclient/index.html')).dir)
            .session({keygrip: ['abracadabra!']});

        initExcalibur(builder.module("excalibur"), this.entries);
        initLogin(builder.module("session"), this.users);
        initLog(builder.module("log"), this.logs);
        this.connector = builder.build();
    }

    async init() {
        await this.entries.init();

        // bootstrap connector
        await this.connector.start();
        // connector.logger.info("started");
    }

    close() {
        this.connector.stop();
        this.entries.destroy();
    }
}

export class SimulatorServices {
    private readonly eeDriver: HttpDriver;
    private readonly pulser: Pulser;
    private readonly oscDriver: OscDriver;

    constructor(options: Options, private fs: FileSystem) {
        this.oscDriver = new OscDriver(options.oscOptions);
        this.pulser = new Pulser();
        this.eeDriver = new HttpDriver(options.eeAddress);
    }

    async init() {
        await Promise.all([
            loadOscEeApi(this.fs, this.pulser.pulse, this.eeDriver, this.oscDriver),
            this.oscDriver.open()
        ]);
        this.pulser.start();
    }

    close() {
        this.oscDriver.close();
        this.pulser.stop();
    }
}

export async function main(optionsArg: ServerOptions) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    const fs: LocalFileSystem = await (new LocalFileSystem(optionsArg.resources)).init();

    await new SimulatorServices(options, fs).init();
    await new FugaziServices(fs).init();
}


export type Options = {
    eeAddress: string;
    terminalsPort: number;
    oscOptions: UdpOptions;
}
export const DEFAULT_OPTIONS: Options = {
    eeAddress: 'http://localhost:8081',
    terminalsPort: 8888,
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57122
    }
};
