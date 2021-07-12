import { EEDriverWithHooks, ESystem } from "empty-epsilon-js";
import { ESwitchBoard, EcrModel, EcrState } from "./model";
import { EcrLogic, lowercaseInfraSystemNames } from "./logic";
import { NetworkDriver, NetworkMessage } from "../mqtt-driver";
import { Observable, Subscription, interval } from "rxjs";

import { EcrDriver } from "./driver";
import { HttpCommandsDriver } from "../core/http-commands";
import { Persistence } from "../core/persistency";
import { switchMap } from 'rxjs/operators';

export class EcrModule {
    private subscription: Subscription;
    private readonly logic: EcrLogic;
    private readonly driver: EcrDriver;
    private pulse: Observable<any> = interval(1111);
    private model: EcrModel;

    constructor(eeDriver: EEDriverWithHooks, private netDriver: NetworkDriver, private httpCommandsDriver: HttpCommandsDriver, private persistence : Persistence<EcrState>) {
        this.driver = new EcrDriver(eeDriver, this.pulse);
        this.model = new EcrModel();
        this.logic = new EcrLogic(this.driver, this.model);
    }

    async init() {
        this.persistence.init(this.model);
        this.netDriver.inbox.subscribe(({target, property, payload}) => {
            const s2 = lowercaseInfraSystemNames.indexOf(target);
            switch (property) {
                case 'fix-everything':
                    this.logic.fixEverything(s2);
                    break;
                case 'complex-error':
                    this.logic.setHardError(s2);
                    break;
                case 'start-up':
                    this.logic.startupSwitchBoard(s2);
                    break;
                case 'shut-down':
                    this.logic.shutdownSwitchBoard(s2);
                    break;
                case 'overload-threshold':
                    const overloadThreshold = Number(payload);
                    this.logic.setOverloadThreshold(s2, overloadThreshold);
                    break;
                case 'reset-load':
                    this.logic.setOverload(s2, 0);
                    break;
                default:
                    console.error('unknown command', property);
            }
        });
        this.httpCommandsDriver.observable.subscribe(e => {
            for (const switchIdStr in ESwitchBoard) {
                const switchId = Number(switchIdStr);
                if (!isNaN(switchId) && e.url.pathname == '/fixeverything/' + ESwitchBoard[switchId]) {
                    this.logic.fixEverything(switchId);
                    e.accept(JSON.stringify(this.model.switchBoards[switchId].toJSON(), null, 2));
                    return;
                }
            }
        });
        this.broadcastSystemsState();
        await this.driver.init();
        await this.logic.init();
    }

    private broadcastSystemsState() {
        this.subscription = this.pulse.pipe(switchMap<any, NetworkMessage[]>(_ => {
            const result: NetworkMessage[] = [];
            /*
            for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
                const system1 = this.logic.getPrimarySystemStatus(s1);
                result.push({
                    address: `/d/repairs/${ESystem[s1]}/repair-rate`,
                    args: {type: 'f', value: system1.repairRate}
                }, {
                    address: `/d/repairs/${ESystem[s1]}/heat-rate`,
                    args: {type: 'f', value: system1.heatRate}
                }, {
                    address: `/d/repairs/${ESystem[s1]}/max-power`,
                    args: {type: 'f', value: system1.maxPower}
                });
            }
            */
            for (let s2 = 0; s2 < ESwitchBoard.COUNT; s2++) {
                const system2 = this.logic.getSwitchBoardStatus(s2);
                const target = ESwitchBoard[s2];
                result.push({
                    target,
                    property: `is-error`,
                    payload: system2.isError ? `1` : `0`
                }, {
                    target,
                    property: `is-online`,
                    payload: system2.isOnline ? `1` : `0`
                }, {
                    target,
                    property: `load`,
                    payload: system2.overload.toFixed(2)
                }, {
                    target,
                    property: `overload-threshold`,
                    payload: system2.overloadErrorThreshold.toFixed(2)
                });
            }
            return result;
        })).subscribe(this.netDriver.outbox);
    }
    
    beginRepair(id: ESystem) {
        this.logic.startRepairingPrimarySystem(id);
    }

    stopRepair() {
        this.logic.stopRepairingPrimarySystem();
    }

    destroy() {
        this.subscription.unsubscribe();
        this.logic.destroy();
    }
}
