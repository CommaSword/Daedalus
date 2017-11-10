import {Observable} from 'rxjs';
import {OscMessage} from "osc";
import {FileSystem} from "kissfs";
import {GameQuery, translateAddressToGameQuery} from "./translate";

export interface GameReadDriver {
    getBuffered<T>(getter: string, numberOfResults: number): Promise<T>;
}

const FILE_PATH = 'game-monitor.json';

export async function getMonitoredAddresses(fs: FileSystem): Promise<Array<string>> {

    const result: Array<string> = [];

    function handleFileContent(fileContent: string) {
        try {
            const addresses: Array<string> = JSON.parse(fileContent);
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
    handleFileContent(await fs.loadTextFile(FILE_PATH));

    return result;
}

//     pulse.switchMap<any, string>(_ => monitoredAddresses)
export function monitorByAddress(pollRequests: Observable<any>, eeDriver: GameReadDriver): Observable<OscMessage> {
    return pollRequests
        .map<string, GameQuery | null>(translateAddressToGameQuery)
        .filter<GameQuery | null, GameQuery>((g: GameQuery | null): g is GameQuery => !!g)
        .flatMap<GameQuery, Array<number>, OscMessage>(
            (q: GameQuery) => eeDriver.getBuffered(q.expr, q.type.length),
            (q: GameQuery, values: Array<any>) => ({
                address: q.address,
                args: values.map((value:any, i:number) => ({type: q.type.charAt(i) as 'i'|'f', value}))
            }))
}
