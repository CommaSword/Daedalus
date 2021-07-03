import 'source-map-support/register'

import {main} from './simulation';
import { parse } from 'cli';

const commandOptions = parse({
    eeAddress : [false, 'The address of the empty-epsilon http api', 'url', 'http://localhost:8081'],
    httpPort : [false, 'The port of the http server', 'int', 56667],
    resources : ['r', 'The location of the configuration + state root folder in the file system', 'file', process.cwd()],
});

main(commandOptions);
