import {Observable} from 'rxjs';
import {OscMessage} from "osc";
import {FileSystem} from "kissfs";
import {GameCommand, GameQuery, translateAddressToGameQuery, translateOscMessageToGameCommand} from "./translate";
import {HttpDriver} from "../empty-epsilon/driver";
import {OscDriver} from "../osc/osc-driver";

export const FILE_PATH = 'game-monitor.json';

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

export function loadOscEeApi(fs: FileSystem, eeDriver: HttpDriver, oscDriver: OscDriver) {
    const pulse = Observable.interval(500);

    const monitoredAddresses = getMonitoredAddresses(fs);
    const pollRequests = pulse.switchMap<any, string>(_ => monitoredAddresses);
    const subscription = monitorByAddress(pollRequests, eeDriver).subscribe(oscDriver.outbox);
    executeDriverCommands(oscDriver.inbox, eeDriver);
    return () => {subscription.unsubscribe();}
}
