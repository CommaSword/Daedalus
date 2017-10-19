import {Request} from "../command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {ResponseStatus} from "@fugazi/connector/scripts/bin/server";
import {Logs} from "./logs";

export default function init(builder: RootModuleBuilder, logs: Logs) {

    builder
        .descriptor({
            title: "log"
        })
        .command('log', {
            title: 'log',
            description: "log information in to the system",
            returns: "void",
            syntax: `log (newLogLine string)`
        })
        .handler(async (request: Request) => {
            const result = await logs.writeToLog(request.data("newLogLine"));
            return {
                status: ResponseStatus.Success,
                data: null
            };
        })
        .parent()
        .command('read-log', {
            title: 'read log',
            description: "returns all system logs",
            returns: "string",
            syntax: `read-log`
        })
        .handler(async (request: Request) => {
            const logData = await logs.openLogFile();
            return {
                status: ResponseStatus.Success,
                data: logData
            };
        })
}
