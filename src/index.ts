import * as fugazi from "@fugazi/connector";
import initExcalibur from "./excalibur/commands";
import initLogin from "./session/commands";
import initLog from "./log/commands";
import {parse} from "path";
import {ServerBuilder} from "@fugazi/connector/scripts/bin/server";
import {Users} from "./session/users";
import {Entries} from "./excalibur/entries";
import {Logs} from "./log/logs";
import {LocalFileSystem} from "kissfs";
import resolve = require("resolve");
import {EmptyEpsilonDriver} from './empty-epsilon/driver';
import {Server, TerminalSession} from "./terminals";

export type ServerOptions = Partial<Options> & {
    resources: string
}


export async function main(optionsArg: ServerOptions) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);

    const eeDriver = new EmptyEpsilonDriver(`http://${options.eeHost}:${options.eePort}`);
    const terminalsServer = new Server(options.terminalsPort);



    terminalsServer.start();
    await demoApplication(terminalsServer, eeDriver);

    // FS drivers
    const fs: LocalFileSystem = await new LocalFileSystem(optionsArg.resources).init();
    // application BL modules
    const users = new Users(fs);
    const entries = new Entries(fs);
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
    connector.logger.info("started");
}


export type Options = {
    eeHost: string;
    eePort: number;
    terminalsPort: number;
}
const DEFAULT_OPTIONS: Options = {
    eeHost: 'localhost',
    eePort: 8081,
    terminalsPort: 8888
};


async function demoApplication(terminalsServer: Server, eeDriver: EmptyEpsilonDriver) {
    terminalsServer.on('connected', (terminal: TerminalSession) => {
        terminal.serverState = 1;
        const playerShip = eeDriver.getPlayerShip();
        let damageDealTimer: NodeJS.Timer;

        async function dealDamage() {
            const hull = await playerShip.getHull();
            await playerShip.setHull(hull * 0.99);
            if (terminal.clientState) {
                damageDealTimer = setTimeout(dealDamage, 150);
            }
        }

        terminal.on('stateChange', () => {
            if (terminal.clientState) {
                // ship should start taking damage
                dealDamage();
            } else {
                // stop taking damage
                clearTimeout(damageDealTimer);
            }
        });
    });
}
