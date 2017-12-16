import {EEDriverWithHooks} from "../empty-epsilon/driver";
import {RepairDriver} from "./driver";
import {InfraSystem, lowercaseInfraSystemNames, RepairLogic} from "./logic";
import {OscDriver} from "../osc/osc-driver";
import {ESystem} from "../empty-epsilon/model";
import {MetaArgument, OscMessage} from "osc";
import {Observable, Subscription} from "rxjs";


export class RepairModule {
    private subscription: Subscription;
    private readonly logic: RepairLogic;
    private readonly repairDriver: RepairDriver;
    private pulse: Observable<any> = Observable.interval(1111);

    constructor(eeDriver: EEDriverWithHooks, private oscDriver: OscDriver) {
        this.repairDriver = new RepairDriver(eeDriver, this.pulse);
        this.logic = new RepairLogic(this.repairDriver);
    }

    async init() {
        await this.repairDriver.init();
        await this.logic.init();
        this.broadcastSystemsState();
        this.oscDriver.inbox.filter(m => m.address.startsWith('/d/repairs')).subscribe(message => {
            const addressArr = message.address.split('/');
            if (addressArr.length === 5) {
                const command = addressArr[4];
                const systemName = addressArr[3].toLowerCase();
                const s2 = lowercaseInfraSystemNames.indexOf(systemName);
                if (~s2) {
                 //   console.log('*********MSG:', message.address);
                    switch (command) {
                        case 'error':
                            this.logic.setError(s2);
                            break;
                        case 'start-up':
                            this.logic.startupSystem2(s2);
                            break;
                        case 'shut-down':
                            this.logic.shutdownSystem2(s2);
                            break;
                        case 'overload-threshold':
                            const overloadThreshold = (message.args as [MetaArgument])[0].value as number;
                            this.logic.setOverloadThreshold(s2, overloadThreshold);
                            break;
                        case 'load':
                            const overload = (message.args as [MetaArgument])[0].value as number;
                            this.logic.setOverload(s2, overload);
                            break;
                        default:
                            console.error('unknown command', command);
                    }
                } else {
                    console.error('unknown system', systemName);
                }
            } else {
                console.error('maleformed address', message.address);
            }
        });
    }

    private broadcastSystemsState() {
        this.subscription = this.pulse.switchMap<any, OscMessage>(_ => {
            const result: OscMessage[] = [];
            // for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            //     const system1 = this.logic.getSystem1Status(s1);
            //     result.push({
            //         address: `/d/repairs/${ESystem[s1]}/repair-rate`,
            //         args: {type: 'f', value: system1.repairRate}
            //     }, {
            //         address: `/d/repairs/${ESystem[s1]}/heat-rate`,
            //         args: {type: 'f', value: system1.heatRate}
            //     }, {
            //         address: `/d/repairs/${ESystem[s1]}/max-power`,
            //         args: {type: 'f', value: system1.maxPower}
            //     });
            // }
            for (let s2 = 0; s2 < InfraSystem.COUNT; s2++) {
                const system2 = this.logic.getSystem2Status(s2);
                result.push({
                    address: `/d/repairs/${InfraSystem[s2]}/is-error`,
                    args: {type: 'i', value: system2.isError ? 1 : 0}
                }, {
                    address: `/d/repairs/${InfraSystem[s2]}/is-online`,
                    args: {type: 'i', value: system2.isOnline ? 1 : 0}
                }, {
                    address: `/d/repairs/${InfraSystem[s2]}/load`,
                    args: {type: 'f', value: system2.overload}
                }, {
                    address: `/d/repairs/${InfraSystem[s2]}/overload-threshold`,
                    args: {type: 'f', value: system2.overloadErrorThreshold}
                });
            }
            return result;
        }).subscribe(this.oscDriver.outbox);
    }

    destroy() {
        this.subscription.unsubscribe();
        this.logic.destroy();
    }
}
