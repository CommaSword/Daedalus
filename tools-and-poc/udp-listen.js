
var server = require('dgram').createSocket('udp4');

const message = Buffer.from('Hello world');
server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
    server.send(message, 8888, "10.0.0.45", (err) => {
        console.log('UDP sent');
    });

});
server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);

});
server.bind(8000);
