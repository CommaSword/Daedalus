require('source-map-support').install();
const path = require('path');


process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

require('./dist/src/index').main({
    resources: path.join(__dirname, 'resources'),
    terminalsPort: 8888,
    eeHost: '10.0.0.7',
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57121
    }
});
