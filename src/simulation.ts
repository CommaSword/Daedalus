import {FileSystem, LocalFileSystem} from "kissfs";
import {HttpCommandsDriver, createHttpCommandsDriver} from "./core/http-commands";
import { MqttDriver, NetworkDriver } from "./mqtt-driver";

import {EcrModule} from "./ecr/index";
import {HttpDriver} from 'empty-epsilon-js';
import {Persistence} from "./core/persistency";

const FILE_PATH = 'game-monitor.json';

export function getMonitoredAddresses(fs: FileSystem): Array<string>{

    const result: Array<string> = [];

    function handleFileContent(fileContent: string) {
        try {
            const addresses: Array<string> = JSON.parse(fileContent.toLowerCase());
            result.splice(0, result.length, ...addresses);
        } catch (e) {
            console.error(`failed parsing ${FILE_PATH} : ${fileContent}`);
        }
    }

    fs.events.on('fileChanged', ({newContent, fullPath}) => {
        if (fullPath === FILE_PATH) {
            handleFileContent(newContent);
        }
    });
    fs.loadTextFile(FILE_PATH).then(handleFileContent);

    return result;
}

class SimulatorServices {
    private readonly httpCommandsDriver: HttpCommandsDriver;
    private readonly eeDriver: HttpDriver;
    private readonly netDriver: MqttDriver;
    private readonly ecrModule: EcrModule;
    // private openEpsilon: OpenEpsilon;

    constructor(options: Options, fs: FileSystem) {
        this.netDriver = new MqttDriver();
        this.httpCommandsDriver = createHttpCommandsDriver({port:options.httpPort || 56667});
        this.eeDriver = new HttpDriver(options.eeAddress);
        this.ecrModule = new EcrModule(this.eeDriver, this.netDriver, this.httpCommandsDriver, new Persistence('ECR', fs, 'ecr-state.json'));
        // this.openEpsilon = new OpenEpsilon(this.eeDriver, this.oscDriver);
        // this.openEpsilon.monitoredAddresses = getMonitoredAddresses(fs);
    }

    async init() {
        await this.netDriver.open();
        await this.ecrModule.init();
        // this.openEpsilon.init();
    }

    close() {
        // this.openEpsilon.destroy();
        this.httpCommandsDriver.destroy();
        this.netDriver.close();
        this.ecrModule.destroy();
        this.eeDriver.close();
    }
}

process.on('uncaughtException', function (err) {
    console.error(err.message);
    console.error(err.stack);
});

export async function main(optionsArg: Options) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);
    const fs: LocalFileSystem = await (new LocalFileSystem(optionsArg.resources)).init();
    const simulatorServices = new SimulatorServices(options, fs);
    const exit = simulatorServices.close.bind(simulatorServices);
    process.once('exit', exit);
    process.once('SIGINT', exit.bind(null, true, 2));
    process.once('SIGTERM', exit.bind(null, true, 15));
    await simulatorServices.init();
}

type Options = {
    resources: string;
    httpPort: number;
    eeAddress: string;
}

const DEFAULT_OPTIONS = {};
