import {FileSystem, LocalFileSystem} from "kissfs";
import {HttpDriver} from './empty-epsilon/driver';
import {loadOscEeApi} from "./osc-bridge/game-monitor";
import {OscDriver} from "./osc/osc-driver";
import {UdpOptions} from "osc";
import {EcrModule} from "./ecr/index";
import {Persistence} from "./core/persistency";

export type ServerOptions = Partial<Options> & {
    resources: string
}

export class SimulatorServices {
    disposer: () => void;
    private readonly eeDriver: HttpDriver;
    private readonly oscDriver: OscDriver;
    private readonly ecrModule: EcrModule;

    constructor(options: Options, private fs: FileSystem) {
        this.oscDriver = new OscDriver(options.oscOptions);
        this.eeDriver = new HttpDriver(options.eeAddress);
        this.ecrModule = new EcrModule(this.eeDriver, this.oscDriver, new Persistence('ECR', fs, 'ecr-state.json'));
    }

    async init() {
        this.disposer = loadOscEeApi(this.fs, this.eeDriver, this.oscDriver);
        await this.oscDriver.open();
        await this.ecrModule.init();
    }

    close() {
        this.disposer();
        this.oscDriver.close();
        this.ecrModule.destroy();
        this.eeDriver.close();
    }
}


process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

export async function main(optionsArg: ServerOptions) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    const fs: LocalFileSystem = await (new LocalFileSystem(optionsArg.resources)).init();
    const simulatorServices = new SimulatorServices(options, fs);
    const exit = simulatorServices.close.bind(simulatorServices);
    process.once('exit', exit);
    process.once('SIGINT', exit.bind(null, true, 2));
    process.once('SIGTERM', exit.bind(null, true, 15));
    await simulatorServices.init();
}


export type Options = {
    eeAddress: string;
    terminalsPort: number;
    oscOptions: UdpOptions;
}

export const DEFAULT_OPTIONS: Options = {
    eeAddress: 'http://localhost:8081',
    terminalsPort: 8888,
    oscOptions: {
        localAddress: "0.0.0.0",
        localPort: 57121,
        remotePort: 57122
    }
};
