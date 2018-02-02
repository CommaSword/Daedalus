import {normInputString, Request, withUser} from "../session/command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {EcrModuleClient} from "./rpc";
import {ESystem} from "empty-epsilon-js";
import {Entries} from "../excalibur/entries";
import {User} from "../session/users";

export default function init(builder: RootModuleBuilder, repair: EcrModuleClient, entries: Entries) {

    builder
        .descriptor({
            title: "E.C.R commands"
        })
        .command('stop', {
            title: 'stop',
            description: `Deactivate the automatic repair subsystem procedure. Re-allocate computation resources to ship cores`,
            returns: 'ui.message',
            syntax: 'stop repair'
        })
        .handler(withUser(async () => {
            await repair.stopRepair();
            return `Automatic repair routine inactive. Computation resources available to ship cores`;
        })).parent()
        .command('do', {
            title: 'do',
            description: `Send a custom order to the ECR auto-mechanic subsystem`,
            returns: 'ui.message',
            syntax: 'do (command string)'
        })
        .handler(withUser(async (request: Request, user: User) => {
            const queryData = normInputString(request.data("command"));
            const result = await entries.query(user, queryData);
            if (result) {
                return `${result} ${Date.now()%2 ? 'beer':'coffee'}?`;
            } else {
                throw new Error('ECR clearance insufficient');
            }
        })).parent();

    Array.from(Array(ESystem.COUNT))
        .forEach((_, systemId) => builder
            .command(`repair_${ESystem[systemId]}`, {
                title: "repair",
                description: `Activate and assign the automatic repair subsystem to ${ESystem[systemId]}. Requires computation resources`,
                returns: "ui.message",
                syntax: `repair ${ESystem[systemId]}`
            })
            .handler(withUser(async () => {
                await repair.beginRepair(systemId);
                return `System ${ESystem[systemId]} automatic repair routine engaged`;
            })).parent());
}
