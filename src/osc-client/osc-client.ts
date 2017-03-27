import * as Promise from 'bluebird';
import {EventEmitter} from 'eventemitter3';
import io = require('socket.io-client');
const patch = require('socketio-wildcard')(io.Manager);

interface Osc{
    target: Array<any>; //WHAT TYPE?
    address: string;
    precision: number;
    args: Array<string|number>; //from the editor
    syncOnly: boolean
}
const knownEvents = {
    'sessionOpen': (data: string) => JSON.parse(data),
    'sessionList': (data:string[]) => data,
    'receiveOsc': (data: Osc) => data
};
class OscClient {
    private events = new EventEmitter();
    private socket: SocketIOClient.Socket
    constructor(){
        this.socket = io('http://localhost:8081');
        patch(this.socket);
        this.socket.on('connect', () => {
            console.log('connect');
            Object.keys(knownEvents).forEach(eventName =>{
                this.socket.on(eventName, (data)=>
                    console.log('INCOMING', eventName, knownEvents[eventName](data)));
            });
            this.socket.on('*', function(e){
                if (!knownEvents[e.data[0]]) {
                    console.log('INCOMING unknown event', e);
                }
            });
            this.socket.on('receiveOsc', (data: Osc)=>{
                data.address = '/panel_1';
                this.socket.emit('sendOsc', data);
            });
            this.socket.emit('ready');
            this.socket.emit('sessionOpened');
        });
        this.socket.on('event', (data) => {
            console.log('data', data);
        });
        this.socket.on('disconnect', () => {
            console.log('disconnect');
        });
    }
}
new OscClient();
