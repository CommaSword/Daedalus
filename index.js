require('source-map-support').install();
const server = require('./dist/src/server');

server.startServer({
    panelsPort: 8888,
    eeHost:'10.0.0.7'
});
