import {ChildProcess, exec, execSync} from 'child_process';
import {HttpDriver} from "../../src/empty-epsilon/driver";
import {retry} from "./retry";
import {expect} from 'chai';

const timeout = 30 * 1000;
const killGrace = 1 * 1000;
const resetGrace = 10;

export type Config = {
    runServer: string;
    killServer: string;
    serverAddress: string;
}

export class ServerManager {
    driver = new HttpDriver(this.config.serverAddress);
    private serverProcess: ChildProcess;
    private assertServerIsUp = async () => {
        await retry(async () => {
            await this.driver.command('getPlayerShip(-1).foo = {0}', ['123']);
            expect(await this.driver.query('getPlayerShip(-1).foo')).to.eql(123);
        }, {interval: 30, timeout: timeout});
    };

    constructor(private config: Config) {
    }

    async init(): Promise<void> {
        this.destroy();
        await new Promise(r => setTimeout(r, killGrace));
        this.serverProcess = exec(this.config.runServer);
        await this.driver.command('setScenario({0}, {1})', ['"scenario_00_basic.lua"', '"Empty"']);
        try {
            await this.assertServerIsUp();
        } catch (e) {
            this.destroy();
            throw e;
        }
    }

    async reset() {
        await this.driver.command('setScenario({0}, {1})', ['"scenario_00_basic.lua"', '"Empty"']);
        try {
            await this.assertServerIsUp();
        } catch (e) {
            await this.init();
        }
        await new Promise(res => setTimeout(res, resetGrace));
    }

    destroy() {
        this.serverProcess && this.serverProcess.kill();
        try {
            execSync(this.config.killServer);
        } catch (e) {

        }
    }
}

export function eeTestServerLifecycle(config: Config) {
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
