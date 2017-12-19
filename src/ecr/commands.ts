import {withUser} from "../session/command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {EcrModuleClient} from "./rpc";
import {ESystem} from "../empty-epsilon/model";

export default function init(builder: RootModuleBuilder, repair: EcrModuleClient) {

    builder
        .descriptor({
            title: "ecr commands"
        })
        .command('stop', {
            title: 'stop',
            returns: 'ui.message',
            syntax: 'stop repair'
        })
        .handler(withUser(async () => {
            await repair.stopRepair();
            return `automatic repair routine inactive`;
        })).parent();

    Array.from(Array(ESystem.COUNT))
        .forEach((_, systemId) => builder
            .command(`repair_${ESystem[systemId]}`, {
                title: "repair",
                returns: "ui.message",
                syntax: `repair ${ESystem[systemId]}`
            })
            .handler(withUser(async () => {
                await repair.beginRepair(systemId);
                return `System ${ESystem[systemId]} automatic repair routine engaged`;
            })).parent());
}
