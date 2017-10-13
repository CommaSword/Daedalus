import {EventEmitter} from 'eventemitter3';
import io = require('socket.io-client');

const patch = require('socketio-wildcard')(io.Manager);

interface Osc {
    target: Array<any>; // [] WHAT TYPE?
    address: string; // '/root' , address of the component
    precision: number; // 0 for integer, 2 for float
    args: Array<string | number>; // the new state of the component
    syncOnly?: boolean // not lately
}

const eventParsers: { [k: string]: (d: any) => any } = {
    'sessionOpen': (data: string) => JSON.parse(data),
    'sessionList': (data: string[]) => data, // ["/app/app/examples/ardour.json","/app/app/examples/demo.json","/app/app/examples/sysex.json"]
    'receiveOsc': (data: Osc) => data,
    'connected': (data: null) => data,
    'sessionNew': (data: null) => data,
};

class OscClient {
    private events = new EventEmitter();
    private socket: SocketIOClient.Socket

    constructor() {
        this.socket = io('http://localhost:8080');
        patch(this.socket);
        this.socket.on('connect', () => {
            console.log('connect');
            Object.keys(eventParsers).forEach(eventName => {
                this.socket.on(eventName, (data: any) =>
                    console.log('INCOMING', eventName, eventParsers[eventName](data)));
            });
            this.socket.on('*', function (e: any) {
                if (!eventParsers[e.data[0]]) {
                    console.log('INCOMING unknown event', e);
                }
            });
            this.socket.on('receiveOsc', (data: Osc) => {
                // data.address = '/panel_1';
                // this.socket.emit('sendOsc', data);
            });
            this.socket.emit('ready'); // ``
            this.socket.emit('sessionOpened');
        });
        this.socket.on('event', (data: any) => {
            console.log('data', data);
        });
        this.socket.on('disconnect', () => {
            console.log('disconnect');
        });
    }
}

new OscClient();

// TODO1 : extract API for terminal logic to listen on and change the state of dashboard components
