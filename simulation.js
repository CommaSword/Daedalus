require('source-map-support').install();
const {parse} = require('cli');

const commandOptions = parse({
    hostname : ['h', 'The hostname of this server', 'ip', '0.0.0.0'],
    eeAddress : [false, 'The address of the empty-epsilon http api', 'url', 'http://localhost:8081'],
    rpcPort : [false, 'The port of the server', 'int', 56667],
    resources : ['r', 'The location of the configuration + state root folder in the file system', 'file', process.cwd()],
});

require('./dist/src/simulation').main(commandOptions);
