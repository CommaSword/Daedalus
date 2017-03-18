import * as Promise from 'bluebird';
import {createServer} from 'net';
import {Socket, Server as NetServer} from "net";
import {isEqual} from 'lodash';
import {Msg, IncomingMsg, isHelloMsg, isNoopMsg, isStateMsg} from "./protocol";
import {EventEmitter} from 'eventemitter3';


export type IncomingEvents = {
    connected:void;
    disconnected:void;
    stateChange : void;
    unknown : IncomingMsg<any>;
}

export interface IncompingReporter{
    emit<T extends keyof IncomingEvents >(event: T, panel:PanelSession, msg?:IncomingEvents[T]);
}


export class Server{
    static readonly incomingEvents:Array<keyof IncomingEvents> = ['connected', 'disconnected', 'stateChange', 'unknown'];
    private server:NetServer;
    private events = new EventEmitter();
    private panels:Array<PanelSession> = [];
    constructor(private port:number){
        this.server = createServer();
        this.server.on('connection', (socket:Socket) =>{
            const panel = new PanelSession(socket, this.events);
            socket.once('close', ()=> this.panels = this.panels.filter(p => p !== panel));
            this.panels.push(panel);
        });
    }

    start(){
        let result = Promise.defer();
        this.server.listen(this.port, (err)=>{
            if (err) return result.reject(err);
            console.log("\nserver listening for panels on port "+this.port);
            result.resolve();
        });
        return result.promise;
    }

    stop(){
        let result = Promise.defer();
        this.server.close((err)=>{
            if (err) return result.reject(err);
            console.log("server no longer listening for panels on port "+this.port+'\n');
            result.resolve();
        });
        return result.promise;
    }

    on<T extends keyof IncomingEvents >(event: T, listener: (panel:PanelSession, msg?:IncomingEvents[T])=>any){
        this.events.on(event, listener);
    }

    once<T extends keyof IncomingEvents >(event: T, listener: (panel:PanelSession, msg?:IncomingEvents[T])=>any){
        this.events.once(event, listener);
    }
}


export class PanelSession {
    readonly remoteAddress:string;
    private _id:string;
    private _state:any;

    constructor(private readonly socket:Socket, private serverEvents:IncompingReporter){
        this.remoteAddress = socket.remoteAddress + ':' + socket.remotePort;

        socket.setTimeout(5000);
        socket.setKeepAlive(true, 300);
        socket.setEncoding('utf8');
        socket.on('data', this.onConnData);
        socket.once('close', this.onConnClose);
        socket.on('timeout', this.onConnTimeout);
        socket.on('error', this.onConnError);
    }

    toString(){
        return this.remoteAddress + (this.id? '('+this.id+')' : '');
    }
    get id(){
        return this._id;
    }
    get state(){
        return this._state;
    }
    public isConneted(){
        return typeof this._id === 'string';
    }
    private onConnData = (d) => {
        const msg = JSON.parse(d) as Msg<any>;
        if (isNoopMsg(msg)){
            // do nothing, it's a no-op!
        } else if (isHelloMsg(msg)){
            this._id = msg.id;
            this._state = msg.state;
            this.serverEvents.emit('connected', this);
        } else if (isStateMsg(msg)){
            if (this.isConneted()){
                if (!isEqual(this._state, msg.state)){
                    this._state = msg.state;
                    this.serverEvents.emit('stateChange', this);
                }
            } else {
                console.log('PanelSession %s out-of-sync message: %s', this, d);
            }
        } else {
            console.log('PanelSession %s unknown message: %s', this, d);
            this.serverEvents.emit('unknown', this, msg);
        }
    };

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
        setTimeout(()=>{
            if (!this.socket.destroyed){
                this.socket.destroy();
            }
        }, 1000);
    };
    write(data:string);
    write(data:Buffer);
    write(data:string|Buffer):Promise<void>{
        const result = Promise.defer<void>();
        this.socket.write(data as any, result.resolve);
        return result.promise;
    }
}
