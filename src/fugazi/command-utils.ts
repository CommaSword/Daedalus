import * as fugazi from "@fugazi/connector";
import {Session as FugaziSession} from "@fugazi/connector/scripts/bin/middleware/session";
import {User, UserData} from "./session/users";

export type Session = {
	user?:UserData;
} & FugaziSession;

export type Request = {session: Session} & fugazi.server.Request;

export function createHandler(fn: (request: fugazi.server.Request) => Promise<any>): (request: fugazi.server.Request) => Promise<fugazi.server.Response> {
	return (request: fugazi.server.Request) => wrapCommandResult(fn(request));
}

export function wrapCommandResult(resultPromise: Promise<any>): Promise<fugazi.server.Response> {
	return resultPromise.then(result => {
		return {
			data: result,
			status: fugazi.server.ResponseStatus.Success
		};
	}).catch(error => {
		return {
			data: error.message,
			status: fugazi.server.ResponseStatus.Failure
		}
	});
}
