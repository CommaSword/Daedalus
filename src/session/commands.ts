import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {Users} from "./users";
import {ResponseStatus} from "@fugazi/connector/scripts/bin/server";
import {Request} from './command-utils';

export default function init(builder: RootModuleBuilder, users: Users) {
    builder
        .descriptor({
            title: "session"
        })
        .command('login', {
            title: 'login',
            description: "log in to the system",
            returns: "string",
            syntax: `login (name string) (password string)`
        })
        .handler((request: Request) => {
            const name = request.data('name');
            const password = request.data('password');

            request.session.user = users.findUserByLogin(name, password);
            if (!request.session.user) {
                return {
                    status: ResponseStatus.Failure,
                    data: 'no matching user record found'
                }
            }
            return {
                status: ResponseStatus.Success,
                data: `Welcome to Fugazi, ${request.session.user.name}, your Excalibur clearance is ${request.session.user.excaliburClearance}.`
            };
        })
        .parent()
        .command('whoami', {
            title: 'whoami',
            description: "display logged in user in current session",
            returns: "string",
            syntax: ['whoami']
        })
        .handler((request: Request) => {
            if (request.session.user) {
                return {
                    status: ResponseStatus.Success,
                    data: `you are ${request.session.user.name}, your Excalibur clearance is ${request.session.user.excaliburClearance}.`
                };
            } else {
                return {
                    status: ResponseStatus.Success,
                    data: 'no logged in user found'
                };
            }
        });
}
