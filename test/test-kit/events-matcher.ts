import {expect} from "chai";
import {IncomingMsg, Msg} from "../../src/core/terminals/protocol";
import {IncomingEvents, Server, TerminalSession} from "../../src/core/terminals";
import {retry} from "./retry";

export type EventObj = {
    event: 'unknown';

} | {
    event: keyof IncomingEvents;
    msg: Msg<any> | undefined;
    terminal: TerminalSession;
}

export type DeepPartial<T> = {
    [P in keyof T]?:DeepPartial<T[P]> | null;
    };


export namespace EventsMatcher {
    export type Options = {
        interval: number;
        noExtraEventsGrace: number;
        timeout: number;
    };
}


function delayedPromise(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
}

export class EventsMatcher {
    private events: Array<EventObj> = [];

    constructor(private options: EventsMatcher.Options) {
    }

    track(server: Server) {
        Server.incomingEvents.forEach(event => server.on(event, (terminal: TerminalSession, msg?: IncomingMsg<any>) => {
            this.events.push({event, msg, terminal});
        }))
    }

    async expect(events: Array<DeepPartial<EventObj>>): Promise<void> {
        await this.expectEvents(events);
        await delayedPromise(this.options.noExtraEventsGrace);
        expect(this.events, 'no further events after matching').to.eql([]);
    }

    private async expectEvents(events: Array<DeepPartial<EventObj>>): Promise<void> {
        if (events.length) {
            try {
                await retry(this.checkEvents.bind(this, events), this.options);
            } catch (e) {
                throw e.failure;
            }
        } else {
            expect(this.events).to.eql([]);
        }
    }

    private checkEvents(events: Array<EventObj>) {
        try {
            expect(this.events).to.containSubset(events);
            this.events = [];
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
