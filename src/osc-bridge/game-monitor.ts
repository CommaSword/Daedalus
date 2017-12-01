import {Observable} from 'rxjs';
import {OscMessage} from "osc";
import {FileSystem} from "kissfs";
import {GameCommand, GameQuery, translateAddressToGameQuery, translateOscMessageToGameCommand} from "./translate";
import {HttpDriver} from "../empty-epsilon/driver";
import {OscDriver} from "../osc/osc-driver";

const FILE_PATH = 'game-monitor.json';

export async function getMonitoredAddresses(fs: FileSystem): Promise<Array<string>> {

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
    handleFileContent(await fs.loadTextFile(FILE_PATH));

    return result;
}

export function monitorByAddress(pollRequests: Observable<any>, eeDriver: HttpDriver): Observable<OscMessage> {
    return pollRequests
        .map<string, GameQuery>(translateAddressToGameQuery)
        .flatMap<GameQuery, Array<number>, OscMessage>(
            (q: GameQuery) => eeDriver.query(q.expr, q.type.length),
            (q: GameQuery, values: Array<any>) => ({
                address: q.address,
                args: values.map((value: any, i: number) => ({type: q.type.charAt(i) as 'i' | 'f', value}))
            }))
}


export function executeDriverCommands(pushRequests: Observable<OscMessage>, eeDriver: HttpDriver): void {
    pushRequests
        .filter(m => m.address.startsWith('/ee/'))
        .map<OscMessage, GameCommand>(translateOscMessageToGameCommand)
        .subscribe(gc => eeDriver.command(gc.template, gc.values));
}

export async function loadOscEeApi(fs: FileSystem, pulse: Observable<any>, eeDriver: HttpDriver, oscDriver: OscDriver) {
    const monitoredAddresses = await getMonitoredAddresses(fs);
    const pollRequests = pulse.switchMap<any, string>(_ => monitoredAddresses);
    monitorByAddress(pollRequests, eeDriver).subscribe(oscDriver.outbox);
    executeDriverCommands(oscDriver.inbox, eeDriver);
}
