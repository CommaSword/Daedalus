import * as fugazi from "@fugazi/connector";
import {Connector} from "@fugazi/connector";
import {FileSystem, LocalFileSystem} from "kissfs";
import initExcalibur from "./excalibur/commands";
import initEcr from "./ecr/commands";
import {parse} from "path";
import {Entries} from "./excalibur/entries";
import {EcrModuleClient} from "./ecr/rpc";
import resolve = require("resolve");

export type ServerOptions = {
    hostname: string;
    port: number;
    ecrPort: number;
    ecrHost: string;
    resources: string;
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
    private readonly ecrCommands: Entries;
    private readonly ecr: EcrModuleClient;
    private readonly connector: Connector;

    constructor(private fs: FileSystem, options: ServerOptions) {
        // application BL modules
        //    this.users = new Users(fs);
        this.entries = new Entries(fs);
        this.ecrCommands = new Entries(fs, {
            entriesPath: 'FAKE_PATH_IGNORE_WARNING_ITS_OK_IM_AN_ENGINEER',
            queriesPath: 'commands',
            queriesPrefix: 'command',
            generateQueryBody() {
                return `DONE!`;
            }
        });
        this.ecr = new EcrModuleClient({hostname: options.ecrHost, port: options.ecrPort});

        // connector API
        const builder = new fugazi.ConnectorBuilder();
        builder.server()
            .port(options.port)
            .host(options.hostname)
            .folder(parse(resolve.sync('daedalus-fugazi-webclient/index.html')).dir)
            .session({keygrip: ['abracadabra!']});

        initExcalibur(builder.module("excalibur"), this.entries);
        initEcr(builder.module("ecr"), this.ecr, this.ecrCommands);
        //   initLogin(builder.module("session"), this.users);
        this.connector = builder.build();
        (this.connector as any)._server.koa.use(async (ctx: any, next: any) => {
            ctx.req.setTimeout(0);
            await next();
        });

    }

    async init() {
        await this.entries.init();
        await this.ecrCommands.init();
        await this.connector.start();
        // DONT INIT ECR RPC, KEEP IT IN HTTP MODE BECAUSE TCP DOES NOT RECONNECT
        // await this.ecr.init();
        // connector.logger.info("started");
    }

    close() {
        this.entries.destroy();
        this.ecrCommands.destroy();
        this.ecr.end();
        this.connector.stop();
    }
}

process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

export async function main(optionsArg: ServerOptions) {
    const fs: LocalFileSystem = await (new LocalFileSystem(optionsArg.resources)).init();
    hookIntoFugaziConnector();
    const fugaziServices = new FugaziServices(fs, optionsArg);
    const exit = fugaziServices.close.bind(fugaziServices);
    process.once('exit', exit);
    process.once('SIGINT', exit.bind(null, true, 2));
    process.once('SIGTERM', exit.bind(null, true, 15));
    await fugaziServices.init();
}
