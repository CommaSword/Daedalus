import * as Promise from 'bluebird';
import {createServer} from 'net';
import {Socket, Server as NetServer} from "net";
import {isEqual} from 'lodash';
import {IncomingMsg, isNoopMsg, validateHelloMsg, validateStateMsg, delimitter} from "./protocol";
import {EventEmitter} from 'eventemitter3';


export type IncomingEvents = {
    connected: void;
    disconnected: void;
    stateChange: void;
    unknown: IncomingMsg<any>;
}

export interface IncompingReporter {
    emit<T extends keyof IncomingEvents >(event: T, ...args:any[]);
}


export class Server {
    static readonly incomingEvents: Array<keyof IncomingEvents> = ['connected', 'disconnected', 'stateChange', 'unknown'];
    private server: NetServer;
    private events = new EventEmitter();
    private panels: Array<PanelSession> = [];

    constructor(private port: number) {
        this.server = createServer();
        this.server.on('connection', (socket: Socket) => {
            const panel = new PanelSession(socket, this.events);
            socket.once('close', () => this.panels = this.panels.filter(p => p !== panel));
            this.panels.push(panel);
        });
    }

    start() {
        let result = Promise.defer();
        this.server.listen(this.port, (err) => {
            if (err) return result.reject(err);
            console.log("\nserver listening for panels on port " + this.port);
            result.resolve();
        });
        return result.promise;
    }

    stop() {
        let result = Promise.defer();
        this.server.close((err) => {
            if (err) return result.reject(err);
            console.log("server no longer listening for panels on port " + this.port + '\n');
            result.resolve();
        });
        return result.promise;
    }


    on<T extends keyof IncomingEvents >(event: T, listener: (panel: PanelSession, msg?: IncomingEvents[T]) => any) {
        this.events.on(event, listener);
    }

    once<T extends keyof IncomingEvents >(event: T, listener: (panel: PanelSession, msg?: IncomingEvents[T]) => any) {
        this.events.once(event, listener);
    }
}


export class PanelSession {
    private events = new EventEmitter();
    readonly remoteAddress: string;
    public serverState: any;
    private _id: string;
    private _clientState: any;
    private lastInputLeftover: string;
    private stateSender: NodeJS.Timer;

    constructor(private readonly socket: Socket, private serverEvents: IncompingReporter) {
        this.remoteAddress = socket.remoteAddress + ':' + socket.remotePort;

        socket.setTimeout(2000);
        //    socket.setKeepAlive(true, 300);
        socket.setEncoding('utf8');
        socket.on('data', this.onConnData);
        socket.once('close', this.onConnClose);
        socket.on('timeout', this.onConnTimeout);
        socket.on('error', this.onConnError);

        this.events.on('connected', (...args)=>serverEvents.emit('connected', this, ...args));
        this.events.on('disconnected', (...args)=>serverEvents.emit('disconnected', this, ...args));
        this.events.on('stateChange', (...args)=>serverEvents.emit('stateChange', this, ...args));
        this.events.on('unknown', (...args)=>serverEvents.emit('unknown', this, ...args));

        this.events.once('connected', ()=>{
            this.stateSender = setInterval(()=>{
                if (this.serverState !== undefined) {
                    this.write(JSON.stringify(this.serverState));
                }
            }, 1000);
        });

        console.log('new PanelSession %s waiting for hello', this);

    }

    toString() {
        return this.remoteAddress + (this.id ? '(' + this.id + ')' : '');
    }

    get id() {
        return this._id;
    }

    get clientState() {
        return this._clientState;
    }

    public isConneted() {
        return typeof this._id === 'string';
    }

    private outOfSync(msg) {
        console.log('PanelSession %s out-of-sync message: %s', this, JSON.stringify(msg));
    }

    private onConnData = (rawMsg) => {
        rawMsg = rawMsg.trim();
        if (this.lastInputLeftover) {
            rawMsg = rawMsg + this.lastInputLeftover;
            this.lastInputLeftover = '';
        }
        console.log('PanelSession %s incoming message: %s', this, rawMsg);
        if (rawMsg) {
            let lines = rawMsg.split(delimitter);
            lines.forEach((line: string, i: number) => {
                line = line.trim();
                let msg;
                try {
                    msg = JSON.parse(line);
                } catch (e) {
                    if (i + 1 === lines.length) {
                        this.lastInputLeftover = line;
                    } else {
                        console.log(e.message, e.stack);
                        console.log('PanelSession %s illegal message format: %s', this, line);
                    }
                }
                if (msg) {
                    this.handleMessage(msg);
                }
            });
        }
    };

    private handleMessage(msg) {
        if (isNoopMsg(msg)) {
            // do nothing, it's a no-op!
        } else if (validateStateMsg(msg)) {
            if (this.isConneted()) {
                if (!isEqual(this._clientState, msg.state)) {
                    console.log('PanelSession %s updating state: %s', this, msg.state);
                    this._clientState = msg.state;
                    this.events.emit('stateChange');
                }
            } else {
                this.outOfSync(msg);
            }
        } else if (validateHelloMsg(msg)) {
            if (this.isConneted()) {
                this.outOfSync(msg);
            } else {
                this._id = msg.id;
                this._clientState = msg.state;
                this.events.emit('connected', this);
                this.events.emit('stateChange');
                console.log('PanelSession %s connected', this);
            }
        } else {
            this.events.emit('unknown', msg);
            console.log('PanelSession %s unknown message: %s', this, JSON.stringify(msg));
        }
    }

    private onConnClose = () => {
        clearInterval(this.stateSender);
        if (this.isConneted()) {
            this.events.emit('disconnected');
        }
        this.events.removeAllListeners();
    };

    private onConnError = (err) => {
        console.log('PanelSession %s error: %s', this, err.message);
    };
    private onConnTimeout = () => {
        console.log('PanelSession %s timeout', this);
        this.socket.end();
        setTimeout(() => {
            if (!this.socket.destroyed) {
                this.socket.destroy();
            }
        }, 1000);
    };

    private write(data: string|Buffer){ //: Promise<void> {
        data = (data as any)+delimitter;
        console.log('PanelSession %s sending: %s', this, data);
        this.socket.write(data);
    }

    on<T extends keyof IncomingEvents >(event: T, listener: (panel: PanelSession, msg?: IncomingEvents[T]) => any) {
        this.events.on(event, listener);
    }

    once<T extends keyof IncomingEvents >(event: T, listener: (panel: PanelSession, msg?: IncomingEvents[T]) => any) {
        this.events.once(event, listener);
    }
}
