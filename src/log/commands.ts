import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {Logs} from "./logs";
import {withUser, Request} from "../session/command-utils";
import {User} from "../session/users";

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
        .handler(withUser(async (request: Request, user: User) => {
            await logs.writeToLog(request.data("newLogLine"));
            return '';
        }))
        .parent()
        .command('read-log', {
            title: 'read log',
            description: "returns all system logs",
            returns: "string",
            syntax: `read-log`
        })
        .handler(withUser(async (request: Request, user: User) => {
            return await logs.openLogFile();
        }));
}
