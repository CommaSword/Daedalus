import {createServer} from 'net';
import {Socket} from "net";

process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

const server = createServer();
server.on('connection', handleConnection);

function handleConnection(socket:Socket) {
    const remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
    console.log('new client connection from %s', remoteAddress);

    socket.setTimeout(5000);
    socket.setKeepAlive(true, 300);
    socket.setEncoding('utf8');

    socket.on('data', onConnData);
    socket.once('close', onConnClose);
    socket.on('timeout', onConnTimeout);
    socket.on('error', onConnError);

    function onConnData(d) {
        console.log('connection data from %s: %j', remoteAddress, d);
        socket.write("ack:"+d);
    }

    function onConnClose() {
        console.log('connection from %s closed', remoteAddress);
    }

    function onConnError(err) {
        console.log('Connection %s error: %s', remoteAddress, err.message);
    }
    function onConnTimeout() {
        console.log('Connection %s timeout', remoteAddress);
        socket.end();
        setTimeout(()=>{
            if (!socket.destroyed){
                socket.destroy();
            }
        }, 1000);
    }
}
server.listen(8888, '172.31.9.2');
console.log("server listening on 172.31.9.2:8888");
