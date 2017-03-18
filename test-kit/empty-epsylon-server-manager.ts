import * as Promise from 'bluebird';
import {exec, ChildProcess} from 'child_process';
import * as config from '../../config.json';
import {EmptyEpsilonDriver} from "../src/empty-epsilon/driver";
import retry = require('bluebird-retry');

export class ServerManager {
    driver = new EmptyEpsilonDriver(config.serverAddress);

    init(): Promise<ChildProcess> {
        const result = exec(config.runServer);
        return retry(() => this.driver.getPlayerShip().getHull(), {interval: 20, timeout: 10 * 1000})
            .then(() => result,
                (e) => {
                    result.kill();
                    throw e;
                });
    }
}
