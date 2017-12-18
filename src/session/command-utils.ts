import {server} from "@fugazi/connector";
import {User, UserData} from "./users";
import {CommandHandler, ResponseStatus} from "@fugazi/connector/scripts/bin/server";
import {Session as FugaziSession} from "@fugazi/connector/scripts/bin/middleware/session";

export type Session = {
    user?: UserData;
} & FugaziSession;

export type Request = { session: Session } & server.Request;

export type HandlerImpl<T> = (request: Request, user: User) => T | Promise<T>

const DEFAULT_USER = new User({
    gender: "ADVANCED",
    name: "system user",
    key: "qwe123",
    excaliburClearance: "TOP_SECRET"
});

export function normInputString(input:string | undefined){
    return input ? input.replace('\\\n', '') : '';
}
export function withUser<T = string>(h: HandlerImpl<T>): CommandHandler {
    return async (request: Request) => {
        try {
            const result = await h(request, DEFAULT_USER);
            return {
                status: ResponseStatus.Success,
                data: result
            };
        } catch (error) {
            return {
                status: ResponseStatus.Failure,
                data: error.message
            };
        }
    };
    /*
        return async (request: Request) => {
            try {
                const userData = request.session.user;
                if (userData) {
                    const result = await h(request, new User(userData));
                    return {
                        status: ResponseStatus.Success,
                        data: result
                    };
                } else {
                    return {
                        status: ResponseStatus.Failure,
                        data: 'You must be logged in'
                    };
                }
            } catch (error) {
                return {
                    status: ResponseStatus.Failure,
                    data: error.message
                };
            }
        };*/
}
