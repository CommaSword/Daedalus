import {Observable} from 'rxjs/Rx';
import {OscMessage} from "osc";

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

//     pulse.switchMap<any, string>(_ => monitoredAddresses)
export function monitorByAddress(pollRequests: Observable<string>, eeDriver: GameReadDriver): Observable<OscMessage> {
    return pollRequests
        .map<string, GameQuery>(makeGameQuery)
        .flatMap<GameQuery, number, OscMessage>(
            (q: GameQuery) => eeDriver.getBuffered(q.expr),
            (q: GameQuery, value: any) => ({
                address: q.address,
                args: [{type: q.type, value}]
            }))
}
