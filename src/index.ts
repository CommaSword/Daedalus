import * as fugazi from "@fugazi/connector";
import {Connector} from "@fugazi/connector";
import {FileSystem, LocalFileSystem} from "kissfs";
import initExcalibur from "./excalibur/commands";
import initLogin from "./session/commands";
import {parse} from "path";
import {Users} from "./session/users";
import {Entries} from "./excalibur/entries";
import {HttpDriver} from './empty-epsilon/driver';
import {loadOscEeApi} from "./osc-bridge/game-monitor";
import {OscDriver} from "./osc/osc-driver";
import {UdpOptions} from "osc";
import {RepairModule} from "./repair-module/index";
import resolve = require("resolve");

export type ServerOptions = Partial<Options> & {
    resources: string
}

function hookIntoFugaziConnector() {
    const sessionModule = require('@fugazi/connector/scripts/bin/middleware/session');
    const oldMW = sessionModule.middleware;
    sessionModule.middleware = (app: any, config: any) => {
        // set 1 hour timeout
        app.use(async (ctx: any, next: any) => {
            ctx.req.setTimeout(60 * 60 * 1000);
            await next();
        });
        return oldMW(app, config);
    };
}
export class FugaziServices {
 //   private readonly users: Users;
    private readonly entries: Entries;
    private readonly connector: Connector;

    constructor(private fs: FileSystem) {
        // application BL modules
    //    this.users = new Users(fs);
        this.entries = new Entries(fs);

        // connector API
        const builder = new fugazi.ConnectorBuilder();
        builder.server()
        //	.host('0.0.0.0')
            .folder(parse(resolve.sync('daedalus-fugazi-webclient/index.html')).dir)
            .session({keygrip: ['abracadabra!']});

        initExcalibur(builder.module("excalibur"), this.entries);
     //   initLogin(builder.module("session"), this.users);
        this.connector = builder.build();
        (this.connector as any)._server.koa.use(async (ctx:any, next:any) => {
            ctx.req.setTimeout(0);
            await next();
        });
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
    disposer: () => void;
    private readonly eeDriver: HttpDriver;
    private readonly oscDriver: OscDriver;
    private readonly repairModule: RepairModule;

    constructor(options: Options, private fs: FileSystem) {
        this.oscDriver = new OscDriver(options.oscOptions);
        this.eeDriver = new HttpDriver(options.eeAddress);
        this.repairModule = new RepairModule(this.eeDriver, this.oscDriver);
    }

    async init() {
        this.disposer = loadOscEeApi(this.fs, this.eeDriver, this.oscDriver);
        await this.oscDriver.open();
        await this.repairModule.init();
      //  this.pulser.start();
    }

    close() {
        this.disposer();
        this.oscDriver.close();
    }
}

export async function main(optionsArg: ServerOptions) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    const fs: LocalFileSystem = await (new LocalFileSystem(optionsArg.resources)).init();
    await new SimulatorServices(options, fs).init();
    hookIntoFugaziConnector();
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
