require('source-map-support').install();
const path = require('path');


require('./src/open-epsilon-server').main({
    resources: path.join(__dirname, 'resources'),
    eeAddress: 'http://192.168.1.103:8081',
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57122
    }
});
