import * as Promise from 'bluebird';
import {exec, execSync, ChildProcess} from 'child_process';
import {EmptyEpsilonDriver} from "../src/empty-epsilon-client/driver";
import retry = require('bluebird-retry');

const timeout = 10 * 1000;

export type Config = {
    runServer: string;
    killServer: string;
    serverAddress: string;
}

export class ServerManager {
    private serverProcess:ChildProcess;
    private driver = new EmptyEpsilonDriver(this.config.serverAddress);
    private assertServerIsUp = ()=>{
        return this.driver.getPlayerShip().getHull();
    };
    constructor(private config:Config){}

    init(): Promise<void> {
        this.serverProcess = exec(this.config.runServer);
        return retry(this.assertServerIsUp, {interval: 20, timeout: timeout})
            .then(() => {},
                (e) => {
                    this.destroy();
                    throw e;
                });
    }

    destroy(){
        this.serverProcess && this.serverProcess.kill();
        execSync(this.config.killServer);
    }
}

export function beforeAndAfter(config:Config){
    let mgr:ServerManager;
    before('init managed server', function(){
        this.timeout(timeout);
        mgr = new ServerManager(config);
        return mgr.init();
    });
    after('destroy managed server', ()=>{
        mgr.destroy();
    });
}
