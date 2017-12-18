import {Request, withUser, normInputString} from "../session/command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {Entries} from "./entries";
import {User} from "../session/users";

export default function init(builder: RootModuleBuilder, entries: Entries) {
    builder
        .descriptor({
            title: "excalibur"
        })
        .command("open", {
            title: "open",
            returns: "ui.markdown",
            syntax: "open (entryName string)"
        })
        .handler(withUser((request: Request, user: User) => {
            const entryName = request.data("entryName");
            const result = entries.open(user, entryName);
            if (result) {
                return result
            } else {
                throw new Error('File not found');
            }
        }))
        .parent()
        .command('list', {
            title: 'list',
            returns: 'list<string>',
            syntax: 'list'
        })
        .handler(withUser(() => {
            return entries.list();
        })).parent()
        .command('query', {
            title: 'query',
            returns: 'ui.markdown',
            syntax: 'query (queryData string)'
        })
        .handler(withUser(async (request: Request, user: User) => {
            const queryData = normInputString(request.data("queryData"));
            const result = await entries.query(user, queryData);
            if (result) {
                return result;
            } else {
                throw new Error('Excalibur clearance insufficient');
            }
        }));
}
