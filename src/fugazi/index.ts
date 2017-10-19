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

function initServer(builder: ServerBuilder) {
    builder
    //	.host('0.0.0.0')
        .folder(parse(resolve.sync('@fugazi/webclient/index.html')).dir)
        .session({keygrip: ['abracadabra!']});
}


export async function run(configPath: string) {
    // FS drivers
    const fs: LocalFileSystem = await new LocalFileSystem(configPath).init();
    // application BL modules
    const users = new Users(fs);
    const entries = new Entries(fs);
    const logs = new Logs(fs);

    // connector API
    const builder = new fugazi.ConnectorBuilder();
    initServer(builder.server());
    initExcalibur(builder.module("excalibur"), entries);
    initLogin(builder.module("session"), users);
    initLog(builder.module("log"), logs);
    const connector = builder.build();

    // bootstrap connector
    await connector.start();
    connector.logger.info("started");
}
