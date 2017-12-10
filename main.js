require('source-map-support').install();
const path = require('path');


process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

// require('./dist/src/index').main({
require('./src/index').main({
    resources: path.join(__dirname, 'resources'),
    terminalsPort: 8888,
    eeAddress: 'http://127.0.0.1:8081',
   // eeAddress: 'http://192.168.1.101:8081',
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57122
    }
});
