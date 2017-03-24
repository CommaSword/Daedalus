import * as Promise from 'bluebird';
import {createServer} from 'net';
import {Socket, Server as NetServer} from "net";
import {isEqual} from 'lodash';
import {IncomingMsg, isNoopMsg, validateHelloMsg, validateStateMsg} from "./protocol";
import {EventEmitter} from 'eventemitter3';


export type IncomingEvents = {
    connected: void;
    disconnected: void;
    stateChange: void;
    unknown: IncomingMsg<any>;
}

export interface IncompingReporter {
    emit<T extends keyof IncomingEvents >(event: T, panel: PanelSession, msg?: IncomingEvents[T]);
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
    readonly remoteAddress: string;
    private _id: string;
    private _state: any;
    private lastInputLeftover: string;
    private stateSender: NodeJS.Timer;

    constructor(private readonly socket: Socket, private serverEvents: IncompingReporter) {
        this.remoteAddress = socket.remoteAddress + ':' + socket.remotePort;

        //    socket.setTimeout(2000);
        //    socket.setKeepAlive(true, 300);
        socket.setEncoding('utf8');
        socket.on('data', this.onConnData);
        socket.once('close', this.onConnClose);
        socket.on('timeout', this.onConnTimeout);
        socket.on('error', this.onConnError);
        // this.stateSender = setInterval(()=>{
        //      this.write(''+(Date.now() % 255));
        // }, 2000);
        console.log('new PanelSession %s waiting for hello', this);
    }

    toString() {
        return this.remoteAddress + (this.id ? '(' + this.id + ')' : '');
    }

    get id() {
        return this._id;
    }

    get state() {
        return this._state;
    }

    public isConneted() {
        return typeof this._id === 'string';
    }

    private outOfSync(msg) {
        console.log('PanelSession %s out-of-sync message: %s', this, JSON.stringify(msg));
    }

    private onConnData = (rawMsg) => {
        rawMsg = this.lastInputLeftover + rawMsg.trim();
        this.lastInputLeftover = '';
        console.log('PanelSession %s incoming message: %s', this, rawMsg);
        if (rawMsg) {
            let lines = rawMsg.split('\n');
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
                if (!isEqual(this._state, msg.state)) {
                    console.log('PanelSession %s updating state: %s', this, msg.state);
                    this._state = msg.state;
                    this.serverEvents.emit('stateChange', this);
                }
            } else {
                this.outOfSync(msg);
            }
        } else if (validateHelloMsg(msg)) {
            if (this.isConneted()) {
                this.outOfSync(msg);
            } else {
                this._id = msg.id;
                this._state = msg.state;
                this.serverEvents.emit('connected', this);
                console.log('PanelSession %s connected', this);
            }
        } else {
            this.serverEvents.emit('unknown', this, msg);
            console.log('PanelSession %s unknown message: %s', this, JSON.stringify(msg));
        }
    }

    private onConnClose = () => {
        if (this.isConneted()) {
            this.serverEvents.emit('disconnected', this);
        }
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

    write(data: string);
    write(data: Buffer);
    write(data: string|Buffer): Promise<void> {
        const result = Promise.defer<void>();
        this.socket.write(data as any, result.resolve);
        return result.promise;
    }
}
