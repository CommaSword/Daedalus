import {EmptyEpsilonDriver} from './empty-epsilon/driver';
import {Server, PanelSession} from "./panels/panels-server";

export type Options = {
    eeHost:string;
    eePort:number;
    panelsPort:number;
}
const DEFAULT_OPTIONS:Options = {
    // TODO support server auto-detection
    // see https://github.com/daid/SeriousProton/blob/dc232f90c755fe001310409d4a7556e0f1d2f3b8/src/multiplayer_server_scanner.cpp
    eeHost:'localhost',
    eePort:8080,
    panelsPort:8888
};
export function startServer(optionsArg:Partial<Options>){
    const options:Options = Object.assign({}, optionsArg, DEFAULT_OPTIONS);

    const eeDriver = new EmptyEpsilonDriver(`http://${options.eeHost}:${options.eePort}`);
    const panelsServer = new Server(options.panelsPort);

    let panelListener = (panel:PanelSession)=>{
        let state = panel.state;
    };

    panelsServer.on('connected', panelListener);
    panelsServer.on('stateChange', panelListener);

    process.on('uncaughtException', function (err) {
        console.error(err.message);
        console.error(err.stack);
    });


    panelsServer.start();
}

