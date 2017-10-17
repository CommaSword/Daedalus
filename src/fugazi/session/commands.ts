import {createHandler, Request} from "../command-utils";
import {RootModuleBuilder} from "@fugazi/connector/scripts/bin/components";
import {Users} from "./users";

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
		.handler(createHandler((request: Request) => {
			const name = request.data('name');
			const password = request.data('password');

			request.session.user = users.findUserByLogin(name, password);
			if (!request.session.user) {
				return Promise.reject(new Error('no matching user record found'));
			}

			return Promise.resolve(`Welcome to Fugazi, ${request.session.user.name}, your Excalibur clearance is ${request.session.user.excaliburClearance}.`);
		}))
		.parent()
		.command('whoami', {
			title: 'whoami',
			description: "display logged in user in current session",
			returns: "string",
			syntax: ['whoami']
		})
		.handler(createHandler((request: Request) => {
			if (request.session.user) {
				return Promise.resolve(`you are ${request.session.user.name}, your Excalibur clearance is ${request.session.user.excaliburClearance}.`);
			} else {
				return Promise.reject(new Error('no logged in user found'));
			}
		}));
}
