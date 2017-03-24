import * as Promise from 'bluebird';
import io = require('socket.io-client');
var patch = require('socketio-wildcard')(io.Manager);

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
    init() {
        const socket = io('http://localhost:8081');
        patch(socket);
        socket.on('connect', () => {
            console.log('connect');
            Object.keys(knownEvents).forEach(eventName =>{
                socket.on(eventName, (data)=>
                    console.log('INCOMING', eventName, knownEvents[eventName](data)));
            });
            socket.on('*', function(e){
                if (!knownEvents[e.data[0]]) {
                    console.log('INCOMING unknown event', e);
                }
            });
            socket.on('receiveOsc', (data: Osc)=>{
                data.address = '/panel_1';
                socket.emit('sendOsc', data);
            });
            socket.emit('ready');
            socket.emit('sessionOpened');
        });
        socket.on('event', (data) => {
            console.log('data', data);
        });
        socket.on('disconnect', () => {
            console.log('disconnect');
        });
    }
}
new OscClient().init();
