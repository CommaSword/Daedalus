import {EmptyEpsilonDriver} from './empty-epsilon/driver';
import {Server, TerminalSession} from "./terminals";

export type Options = {
    eeHost: string;
    eePort: number;
    terminalsPort: number;
}
const DEFAULT_OPTIONS: Options = {
    // TODO support server auto-detection
    // see https://github.com/daid/SeriousProton/blob/dc232f90c755fe001310409d4a7556e0f1d2f3b8/src/multiplayer_server_scanner.cpp
    eeHost: 'localhost',
    eePort: 8081,
    terminalsPort: 8888
};

export function startServer(optionsArg: Partial<Options>) {
    const options: Options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);

    const eeDriver = new EmptyEpsilonDriver(`http://${options.eeHost}:${options.eePort}`);
    const terminalsServer = new Server(options.terminalsPort);

    process.on('uncaughtException', function (err: Error) {
        console.error(err.message);
        console.error(err.stack);
    });

    terminalsServer.start();

    terminalsServer.on('connected', (terminal: TerminalSession) => {
        terminal.serverState = 1;
        const playerShip = eeDriver.getPlayerShip();
        let damageDealTimer: NodeJS.Timer;

        async function dealDamage() {
            const hull = await playerShip.getHull();
            await playerShip.setHull(hull * 0.99);
            if (terminal.clientState) {
                damageDealTimer = setTimeout(dealDamage, 150);
            }
        }

        terminal.on('stateChange', () => {
            if (terminal.clientState) {
                // ship should start taking damage
                dealDamage();
            } else {
                // stop taking damage
                clearTimeout(damageDealTimer);
            }
        });
    });
}


function gizmoImplPOC(terminal: { serverState: any, clientState: any, connected: boolean },
                      dashboard: { state: any },
                      emptyEpsilon: EmptyEpsilonDriver) {

    let damageDealTimer: NodeJS.Timer;

    async function dealDamage() {
        const playerShip = emptyEpsilon.getPlayerShip();
        const hull = await playerShip.getHull();
        await playerShip.setHull(hull * 0.99);
        if (terminal.clientState) {
            damageDealTimer = setTimeout(dealDamage, 150);
        }
    }

    return () => {
        dashboard.state.connected = terminal.connected;
        terminal.serverState = dashboard.state.active ? 1 : 0;

        if (terminal.clientState) {
            // ship should start taking damage
            dealDamage();
        } else {
            // stop taking damage
            clearTimeout(damageDealTimer);
        }
    }
}
