import {createServer, Server as NetServer, Socket} from 'net';
import {isEqual} from 'lodash';
import {delimitter, IncomingMsg, isNoopMsg, Msg, validateHelloMsg, validateStateMsg} from "./protocol";
import {EventEmitter} from 'eventemitter3';


export type IncomingEvents = {
    connected: void;
    disconnected: void;
    stateChange: void;
    unknown: IncomingMsg<any>;
}

export interface IncompingReporter {
    emit<T extends keyof IncomingEvents>(event: T, ...args: any[]): any;
}


export class Server {
    static readonly incomingEvents: Array<keyof IncomingEvents> = ['connected', 'disconnected', 'stateChange', 'unknown'];
    private server: NetServer;
    private events = new EventEmitter();
    private terminals: Array<TerminalSession> = [];

    constructor(private port: number) {
        this.server = createServer();
        this.server.on('connection', (socket: Socket) => {
            const terminal = new TerminalSession(socket, this.events);
            socket.once('close', () => this.terminals = this.terminals.filter(p => p !== terminal));
            this.terminals.push(terminal);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (err?: Error) => {
                if (err) return reject(err);
                console.log("\nserver listening for terminals on port " + this.port);
                resolve();
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.server.close((err?: Error) => {
                if (err) return reject(err);
                console.log("server no longer listening for terminals on port " + this.port + '\n');
                resolve();
            })
        });
    }


    on<T extends keyof IncomingEvents>(event: T, listener: (terminal: TerminalSession, msg?: IncomingEvents[T]) => any) {
        this.events.on(event, listener);
    }

    once<T extends keyof IncomingEvents>(event: T, listener: (terminal: TerminalSession, msg?: IncomingEvents[T]) => any) {
        this.events.once(event, listener);
    }
}


export class TerminalSession {
    readonly remoteAddress: string;
    public serverState: any;
    private events = new EventEmitter();
    private lastInputLeftover: string;
    private stateSender: NodeJS.Timer;
    private onConnData = (rawMsg: string) => {
        rawMsg = rawMsg.trim();
        if (this.lastInputLeftover) {
            rawMsg = rawMsg + this.lastInputLeftover;
            this.lastInputLeftover = '';
        }
        console.log('TerminalSession %s incoming message: %s', this, rawMsg);
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
                        console.log('TerminalSession %s illegal message format: %s', this, line);
                    }
                }
                if (msg) {
                    this.handleMessage(msg);
                }
            });
        }
    };
    private onConnClose = () => {
        clearInterval(this.stateSender);
        if (this.isConneted()) {
            this.events.emit('disconnected');
        }
        this.events.removeAllListeners();
    };
    private onConnError = (err: Error) => {
        console.log('TerminalSession %s error: %s', this, err.message);
    };
    private onConnTimeout = () => {
        console.log('TerminalSession %s timeout', this);
        this.close();
    };

    constructor(private readonly socket: Socket, private serverEvents: IncompingReporter) {
        this.remoteAddress = socket.remoteAddress + ':' + socket.remotePort;

        socket.setTimeout(2000);
        //    socket.setKeepAlive(true, 300);
        socket.setEncoding('utf8');
        socket.on('data', this.onConnData);
        socket.once('close', this.onConnClose);
        socket.on('timeout', this.onConnTimeout);
        socket.on('error', this.onConnError);

        this.events.on('connected', (...args) => serverEvents.emit('connected', this, ...args));
        this.events.on('disconnected', (...args) => serverEvents.emit('disconnected', this, ...args));
        this.events.on('stateChange', (...args) => serverEvents.emit('stateChange', this, ...args));
        this.events.on('unknown', (...args) => serverEvents.emit('unknown', this, ...args));

        this.events.once('connected', () => {
            this.stateSender = setInterval(() => {
                if (this.serverState !== undefined) {
                    this.write(JSON.stringify(this.serverState));
                }
            }, 1000);
        });

        console.log('new TerminalSession %s waiting for hello', this);

    }

    private _id: string;

    get id() {
        return this._id;
    }

    private _clientState: any;

    get clientState() {
        return this._clientState;
    }

    toString() {
        return this.remoteAddress + (this.id ? '(' + this.id + ')' : '');
    }

    public isConneted() {
        return typeof this._id === 'string';
    }

    public close() {
        this.socket.end();
        setTimeout(() => {
            if (!this.socket.destroyed) {
                this.socket.destroy();
            }
        }, 1000);
    }

    on<T extends keyof IncomingEvents>(event: T, listener: (terminal: TerminalSession, msg?: IncomingEvents[T]) => any) {
        this.events.on(event, listener);
    }

    once<T extends keyof IncomingEvents>(event: T, listener: (terminal: TerminalSession, msg?: IncomingEvents[T]) => any) {
        this.events.once(event, listener);
    }

    private outOfSync(msg: any) {
        console.log('TerminalSession %s out-of-sync message: %s', this, JSON.stringify(msg));
    }

    private handleMessage(msg: Msg<any>) {
        if (isNoopMsg(msg)) {
            // do nothing, it's a no-op!
        } else if (validateStateMsg(msg)) {
            if (this.isConneted()) {
                if (!isEqual(this._clientState, msg.state)) {
                    console.log('TerminalSession %s updating state: %s', this, msg.state);
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
                console.log('TerminalSession %s connected', this);
            }
        } else {
            this.events.emit('unknown', msg);
            console.log('TerminalSession %s unknown message: %s', this, JSON.stringify(msg));
        }
    }

    private write(data: string | Buffer) {
        data = (data as any) + delimitter;
        console.log('TerminalSession %s sending: %s', this, data);
        this.socket.write(data);
    }
}
