require('source-map-support').install();
const path = require('path');


process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

require('./dist/src/index').main({
//require('./src/index').main({
    resources: path.join(__dirname, 'resources'),
    terminalsPort: 8888,
    eeHost: 'localhost',
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57122
    }
});
