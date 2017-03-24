require('source-map-support').install();
const server = require('./dist/src/server');

server.startServer({
    panelsPort: 8888
});
