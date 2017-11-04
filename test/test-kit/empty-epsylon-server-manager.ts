import {ChildProcess, exec, execSync} from 'child_process';
import {HttpDriver} from "../../src/empty-epsilon/driver";
import {retry} from "./retry";

const timeout = 10 * 1000;
const delay = 1 * 1000;

export type Config = {
    runServer: string;
    killServer: string;
    serverAddress: string;
}

export class ServerManager {
    private serverProcess: ChildProcess;
    driver = new HttpDriver(this.config.serverAddress);
    private assertServerIsUp = () => {
        //         return this.driver.get('getPlayerShip(-1)', 'getHull()');

        return this.driver.getBuffered('getPlayerShip(-1):getHull()');
    };

    constructor(private config: Config) {
    }

    async init(): Promise<void> {
        await new Promise(r => setTimeout(r, delay));
        this.serverProcess = exec(this.config.runServer);
        try {

            await retry(this.assertServerIsUp, {interval: 30, timeout: timeout});
        } catch (e) {
            this.destroy();
            throw e;
        }
    }

    async reset() {
   //     await this.driver.setToValueBuffered('setScenario', '"scenario_00_basic.lua", "Empty"');
        await new Promise(r => setTimeout(r, 100));
    }

    destroy() {
        this.serverProcess && this.serverProcess.kill();
        try {
            execSync(this.config.killServer);
        } catch (e) {

        }
    }
}

export function beforeAndAfter(config: Config) {
    let mgr: ServerManager;
    before('init managed server', function () {
        this.timeout(timeout);
        mgr = new ServerManager(config);
        return mgr.init();
    });
    beforeEach('reset scenario', () => {
        return mgr.reset()
    });
    after('destroy managed server', () => {
        mgr.destroy();
    });
}
