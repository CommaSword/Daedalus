import * as Promise from 'bluebird';
import {createServer} from 'net';
import {Socket, Server as NetServer} from "net";
import {Msg, MsgType, Noop_MsgType, IncomingMsg} from "./protocol";
import {EventEmitter} from 'eventemitter3';


export type IncomingEvents = {
    unknown : IncomingMsg<any>;
}
export type IncomingEventType = keyof IncomingEvents & (MsgType|'unknown');

export interface IncompingReporter{
    emit<T extends IncomingEventType >(event: T, msg:IncomingEvents[T], panel:Connection);
}

export class Connection {
    readonly remoteAddress:string;

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

    private onConnData = (d) => {
        console.log('connection data from %s: %j', this.remoteAddress, d);
        const msg = JSON.parse(d) as Msg<any>;
        switch(msg.type){
            case 'noop':
                break;
            default:
                this.serverEvents.emit('unknown', msg, this);
        }
    };

    private onConnClose = () => {
        console.log('connection from %s closed', this.remoteAddress);
    };

    private onConnError = (err) => {
        console.log('Connection %s error: %s', this.remoteAddress, err.message);
    };
    private onConnTimeout = () => {
        console.log('Connection %s timeout', this.remoteAddress);
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


export class Server{
    static readonly incomingEvents:Array<IncomingEventType> = ['unknown'];
    private server:NetServer;
    private events = new EventEmitter();
    private panels:Array<Connection> = [];
    constructor(private port:number){
        this.server = createServer();
        this.server.on('connection', (socket:Socket) =>{
            const panel = new Connection(socket, this.events);
            socket.once('close', ()=> this.panels = this.panels.filter(p => p !== panel));
            this.panels.push(panel);
        });
    }

    start(){
        let result = Promise.defer();
        this.server.listen(this.port, (err)=>{
            if (err) return result.reject(err);
            console.log("server listening for panels on port "+this.port);
            result.resolve();
        });
        return result.promise;
    }

    stop(){
        let result = Promise.defer();
        this.server.close((err)=>{
            if (err) return result.reject(err);
            console.log("server no longer listening for panels on port "+this.port);
            result.resolve();
        });
        return result.promise;
    }

    on<T extends IncomingEventType >(event: T, listener: (msg:IncomingEvents[T], panel:Connection)=>any){
        this.events.on(event, listener);
    }

    once<T extends IncomingEventType >(event: T, listener: (msg:IncomingEvents[T], panel:Connection)=>any){
        this.events.once(event, listener);
    }
}

