import * as fugazi from "@fugazi/connector";
import {Session as FugaziSession} from "@fugazi/connector/scripts/bin/middleware/session";
import {UserData} from "./session/users";

export type Session = {
    user?: UserData;
} & FugaziSession;

export type Request = { session: Session } & fugazi.server.Request;

export function createHandler(fn: (request: fugazi.server.Request) => Promise<any>): (request: fugazi.server.Request) => Promise<fugazi.server.Response> {
    return (request: fugazi.server.Request) => wrapCommandResult(fn(request));
}

export async function wrapCommandResult(resultPromise: Promise<any>): Promise<fugazi.server.Response> {
    try {
        const result = await resultPromise;
        return {
            data: result,
            status: fugazi.server.ResponseStatus.Success
        };
    } catch (error) {
        return {
            data: error.message,
            status: fugazi.server.ResponseStatus.Failure
        };
    }
}
