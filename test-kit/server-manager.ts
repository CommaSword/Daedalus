import * as Promise from 'bluebird';
import {exec, ChildProcess} from 'child_process';
import * as config from '../../config.json';
import {HttpServerDriver} from "../src/http-server-driver";
import retry = require('bluebird-retry');

export class ServerManager {
    driver = new HttpServerDriver();

    init(): Promise<ChildProcess> {
        const result = exec(config.runServer);
        return retry(() => this.driver.getHull(), {interval: 20, timeout: 10 * 1000})
            .then(
                () => result,
                (e) => {
                    result.kill();
                    throw e;
                });
    }
}
