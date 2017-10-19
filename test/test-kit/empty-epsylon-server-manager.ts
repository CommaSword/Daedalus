import {ChildProcess, exec, execSync} from 'child_process';
import {EmptyEpsilonDriver} from "../../src/empty-epsilon/driver";
import {retry} from "./retry";

const timeout = 10 * 1000;

export type Config = {
    runServer: string;
    killServer: string;
    serverAddress: string;
}

export class ServerManager {
    private serverProcess: ChildProcess;
    private driver = new EmptyEpsilonDriver(this.config.serverAddress);
    private assertServerIsUp = () => {
        return this.driver.getPlayerShip().getHull();
    };

    constructor(private config: Config) {
    }

    async init(): Promise<void> {
        this.serverProcess = exec(this.config.runServer);
        try {

            await retry(this.assertServerIsUp, {interval: 20, timeout: timeout});
        } catch (e) {
            this.destroy();
            throw e;
        }
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
    after('destroy managed server', () => {
        mgr.destroy();
    });
}
