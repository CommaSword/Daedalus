require('source-map-support').install();
const server = require('./dist/src/server');

server.startServer({
    terminalsPort: 8888,
    eeHost:'10.0.0.7'
});
