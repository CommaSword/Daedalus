import {Observable} from 'rxjs/Rx';
import {OscMessage} from "osc";
import {FileSystem} from "kissfs";

function makeGameQuery(address: string): GameQuery {
    return {
        address,
        expr: `getPlayerShip(-1):getRotation()`, // fake translation till we have a working one
        type: 'f'
    };
}

interface GameQuery {
    address: string;
    expr: string;
    type: 'f' | 'i';
}

export interface GameReadDriver {
    getBuffered<T>(getter: string): Promise<T>;
}
const FILE_PATH = 'game-monitor.json';

export async function getMonitoredAddresses(fs: FileSystem): Promise<Array<string>> {

    const result: Array<string> = [];

    function handleFileContent(fileContent: string) {
        try {
            const addresses: Array<string> = JSON.parse(fileContent);
            result.splice(0, result.length, ...addresses);
        } catch(e){
            console.error(`failed parsing ${FILE_PATH} : ${fileContent}`);
        }
    }

    fs.events.on('fileChanged', ({newContent, fullPath}) => {
        if (fullPath === FILE_PATH) {
            handleFileContent(newContent);
        }
    });
    handleFileContent(await fs.loadTextFile(FILE_PATH));

    return result;
}

//     pulse.switchMap<any, string>(_ => monitoredAddresses)
export function monitorByAddress(pollRequests: Observable<any>, eeDriver: GameReadDriver): Observable<OscMessage> {
    return pollRequests
        .map<string, GameQuery>(makeGameQuery)
        .flatMap<GameQuery, number, OscMessage>(
            (q: GameQuery) => eeDriver.getBuffered(q.expr),
            (q: GameQuery, value: any) => ({
                address: q.address,
                args: [{type: q.type, value}]
            }))
}
