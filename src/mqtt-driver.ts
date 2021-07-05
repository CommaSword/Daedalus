import { AsyncMqttClient, IPublishPacket, connectAsync } from 'async-mqtt';
import { Observable, Subject, Subscription, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { ESwitchBoard } from './ecr/model';
import { NextObserver } from "rxjs/Observer";
import { lowercaseInfraSystemNames } from './ecr/logic';

// https://www.hivemq.com/blog/mqtt-essentials-part-5-mqtt-topics-best-practices/

export interface NetworkMessage {
    target: string;
    property: string;
    payload: string;
}
export interface NetworkDriver {
    readonly inbox: Observable<NetworkMessage>;
    readonly outbox: NextObserver<NetworkMessage>;
}

export class MqttDriver implements NetworkDriver {
    
    private client: Promise<AsyncMqttClient>;
    
    private readonly subscriptions = new Array<Subscription>();

    private readonly _inbox = new Subject<NetworkMessage>();
    private readonly _outbox = new Subject<NetworkMessage>();

    constructor() {
        this.client = connectAsync(`tcp://localhost:1883`);
        this.client.then(async (c) => {
            fromEvent<[string, Buffer, IPublishPacket]>(c, 'message')
                .pipe(
                    map(this.parseMessage),
                    filter((id: NetworkMessage | null): id is NetworkMessage => id !== null))
                .subscribe(this._inbox);
            console.log(`connected to mqtt : tcp://localhost:1883`);
        });

        this.subscriptions.push(this._outbox.subscribe(this.publish));
    }

    get outbox():NextObserver<NetworkMessage>{
        return this._outbox;
    }
    get inbox():Observable<NetworkMessage>{
        return this._inbox;
    }

    private publish = async (msg: NetworkMessage) => {
        try {
            await (await this.client).publish(`d-out/${msg.target}/${msg.property}`, msg.payload);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
        }
    }
    
    private parseMessage = ([topic, payload]: [string, Buffer, unknown]): NetworkMessage | null => {
        // /d-in/A1
        const addressArr = topic.split('/');
        if (addressArr.length === 3) {
            const command = addressArr[2];
            const systemName = addressArr[1].toLowerCase();
            const s2 = lowercaseInfraSystemNames.indexOf(systemName);
            if (~s2) {
                return {
                    target: systemName,
                    property: command,
                    payload: payload.toString('utf8')
                };
            } else {
                console.error('unknown system', systemName);
                return null;
            }
        } else {
            console.error('maleformed topic', topic, payload);
            return null;
        }
    };

    async open() {
        await (await this.client).subscribe('d-in/#');
    }

    close() {
        this.subscriptions.forEach(s => s.unsubscribe());
        void this.client.then(async (c) => c.end());
    }
}
