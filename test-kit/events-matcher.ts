import {expect} from "chai";
import * as Promise from 'bluebird';
import * as retry from 'bluebird-retry';
import {EventEmitter} from 'eventemitter3';
import {Msg, IncomingMsg} from "../src/panels/protocol";
import {PanelSession, Server, IncomingEvents} from "../src/panels/panels-server";

export interface EventObj{
    event:keyof IncomingEvents;
    msg:Msg<any>|undefined;
    panel:PanelSession;
}

export type DeepPartial<T> = {
    [P in keyof T]?:DeepPartial<T[P]>|null;
    };


export namespace EventsMatcher {
    export type Options = {
        interval: number;
        noExtraEventsGrace: number;
        timeout: number;
    };
}

export class EventsMatcher{
    private events: Array<EventObj> = [];
    constructor(private options:EventsMatcher.Options){}

    track(server: Server) {
        Server.incomingEvents.forEach(event => server.on(event, (panel:PanelSession, msg?: IncomingMsg<any>) => {
            this.events.push({event, msg, panel});
        }))
    }

    expect(events: Array<DeepPartial<EventObj>>):Promise<void>{
        return this.expectEvents(events)
            .delay(this.options.noExtraEventsGrace)
            .then(()=>{expect(this.events, 'no further events after matching').to.eql([]);});
    }

    private expectEvents(events: Array<DeepPartial<EventObj>>):Promise<void>{
        if (events.length) {
            return retry(this.checkEvents.bind(this, events), this.options)
                .then(()=>undefined)
                .catch(e => {
                    throw e.failure;
                });
        } else {
            expect(this.events).to.eql([]);
            return Promise.resolve();
        }
    }

    private checkEvents(events: Array<EventObj>){
        try {
            expect(this.events).to.containSubset(events);
            this.events = [];
            return Promise.resolve();
        } catch(e){
            return Promise.reject(e);
        }
    }
}
