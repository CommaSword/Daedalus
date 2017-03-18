import {expect} from "chai";
import * as Promise from 'bluebird';
import * as retry from 'bluebird-retry';
import {EventEmitter} from 'eventemitter3';
import {Msg} from "../src/panels/protocol";
import {Connection, Server, IncomingEventType} from "../src/panels/panels-server";

export interface EventObj{
    msg:Msg;
    panel:Connection;
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

    // track(server: Server, ...eventNames: Array<IncomingEventType>) {
    track(server: Server) {
        const incomingEvents:Array<IncomingEventType> = ['unknown'];
        incomingEvents.forEach(eventName => server.on(eventName, (msg: Msg, panel:Connection) => {
            if (eventName !== 'unknown'){
                expect(msg.type, `type of event dispatched as ${eventName}`).to.eql(eventName);
            }
            this.events.push({msg, panel});
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
