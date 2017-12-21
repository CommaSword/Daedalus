require('source-map-support').install();
const {parse} = require('cli');

const commandOptions = parse({
    hostname : ['h', 'The hostname of the server', 'ip'],
    ecrHost : [false, 'The hostname of the ECR server', 'ip'],
    ecrPort : [false, 'The port of the ECR server', 'int', 56667],
    port : ['p', 'The port of the server', 'int', 3333],
    resources : ['r', 'The location of the resources root folder in the file system', 'file', process.cwd()],
    commands : ['c', 'The location of the commands root folder in the file system', 'file', process.cwd()],
});

require('./dist/src/fugazi').main(commandOptions);
