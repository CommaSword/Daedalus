import {EmptyEpsilonDriver} from './empty-epsilon/driver';
import {Server} from "./panels/panels-server";

export type Options = {
    eeHost:string;
    eePort:number;
    panelsPort:number;
}
const DEFAULT_OPTIONS:Options = {
    eeHost:'localhost',
    eePort:8080,
    panelsPort:8888
};
export function startServer(optionsArg:Partial<Options>){
    const options:Options = Object.assign({}, optionsArg, DEFAULT_OPTIONS);

    const eeDriver = new EmptyEpsilonDriver(`http://${options.eeHost}:${options.eePort}`);
    const panelsServer = new Server(options.panelsPort);


    process.on('uncaughtException', function (err) {
        console.error(err.message);
        console.error(err.stack);
    });

}

