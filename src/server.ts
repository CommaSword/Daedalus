import {EmptyEpsilonDriver} from './empty-epsilon-client/driver';
import {Server, PanelSession} from "./panels-server";

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
    const options:Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);

    const eeDriver = new EmptyEpsilonDriver(`http://${options.eeHost}:${options.eePort}`);
    const panelsServer = new Server(options.panelsPort);


    process.on('uncaughtException', function (err:Error) {
        console.error(err.message);
        console.error(err.stack);
    });

    panelsServer.start();

    panelsServer.on('connected', (panel:PanelSession)=>{
        panel.serverState = 1;
        const playerShip = eeDriver.getPlayerShip();
        let damageDealTimer:NodeJS.Timer;
        function dealDamage(){
            playerShip.getHull()
                .then(hull =>  playerShip.setHull(hull * 0.99))
                .then(()=>{
                    if (panel.clientState) {
                        damageDealTimer = setTimeout(dealDamage, 150);
                    }
                })
        }
        panel.on('stateChange', ()=>{
            if (panel.clientState){
                // ship should start taking damage
                dealDamage();
            } else {
                // stop taking damage
                clearTimeout(damageDealTimer);
            }
        });
    });
}



function gizmoImplPOC(
    panel:{serverState:any, clientState:any, connected:boolean},
    dashboard:{state:any},
    emptyEpsilon:EmptyEpsilonDriver){

    let damageDealTimer:NodeJS.Timer;
    function dealDamage(){
        const playerShip = emptyEpsilon.getPlayerShip();
        playerShip.getHull()
            .then(hull =>  playerShip.setHull(hull * 0.99))
            .then(()=>{
                if (panel.clientState) {
                    damageDealTimer = setTimeout(dealDamage, 150);
                }
            })
    }
    return () => {
        dashboard.state.connected = panel.connected;
        panel.serverState = dashboard.state.active ? 1 : 0;

        if (panel.clientState) {
            // ship should start taking damage
            dealDamage();
        } else {
            // stop taking damage
            clearTimeout(damageDealTimer);
        }
    }
}
