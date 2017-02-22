import * as Promise from 'bluebird';
import {exec} from 'child_process';
import * as config from '../../config.json';

export class ServerConnection{
    init() {
        exec(config.runServer);
    }
}
