import {normInputNumber, Request, withUser} from "../session/command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {EcrModuleClient} from "./rpc";
import {ESystem} from "../empty-epsilon/model";

export default function init(builder: RootModuleBuilder, repair: EcrModuleClient) {
    builder
        .descriptor({
            title: "ecr"
        })
        .command("repair", {
            title: "repair",
            returns: "string",
            syntax: "repair system (systemId number)"
        })
        .handler(withUser(async (request: Request) => {
            const systemId = normInputNumber(request.data("systemId"));
            if (systemId > ESystem.None && systemId < ESystem.COUNT) {
                await repair.beginRepair(systemId);
                return `System ${ESystem[systemId]} automatic repair routine engaged`;
            } else {
                throw new Error(`Invalid system ID (${ESystem.None + 1} - ${ESystem.COUNT - 1})`);
            }
        })).parent()
        .command('stop', {
            title: 'stop',
            returns: 'string',
            syntax: 'stop repair'
        })
        .handler(withUser(async () => {
            await repair.stopRepair();
            return `automatic repair routine inactive`;
        })).parent()
    ;
}
