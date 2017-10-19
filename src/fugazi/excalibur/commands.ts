import {Request} from "../command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {Entries} from "./entries";
import {ResponseStatus} from "@fugazi/connector/scripts/bin/server";
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
        .handler((request: Request) => {
            const entryName = request.data("entryName");
            if (request.session.user) {
                const result = entries.open(new User(request.session.user), entryName);
                if (result) {
                    return {
                        status: ResponseStatus.Success,
                        data: result
                    };
                } else {
                    return {
                        status: ResponseStatus.Failure,
                        data: 'File not found'
                    };
                }
            } else {
                return {
                    status: ResponseStatus.Failure,
                    data: 'You must logged in'
                };
            }
        })
        .parent()
        .command('list', {
            title: 'list',
            returns: 'string',
            syntax: 'list'
        })
        .handler((request: Request) => {
            if (!request.session.user) {
                return {
                    status: ResponseStatus.Failure,
                    data: ['Login required']
                };
            }
            return {
                status: ResponseStatus.Success,
                data: entries.list()
            };
        }).parent()
        .command('query', {
            title: 'query',
            returns: 'ui.markdown',
            syntax: 'query (queryData string)'
        })
        .handler(async (request: Request) => {
            const queryData = request.data("queryData");
            if (request.session.user) {
                const result = await entries.query(new User(request.session.user), queryData);
                if (result) {
                    return {
                        status: ResponseStatus.Success,
                        data: result
                    };
                } else {
                    return {
                        status: ResponseStatus.Failure,
                        data: 'Query finished'
                    };
                }
            } else {
                return {
                    status: ResponseStatus.Failure,
                    data: 'You must logged in'
                };
            }
        })
}
