import {EEDriverWithHooks} from "../empty-epsilon/driver";
import {RepairDriver} from "./driver";
import {InfraSystem, RepairLogic} from "./logic";
import {OscDriver} from "../osc/osc-driver";
import {ESystem} from "../empty-epsilon/model";
import {OscMessage} from "osc";
import {Subscription, Observable} from "rxjs";


export class RepairModule {
    private subscription: Subscription;
    private readonly logic: RepairLogic;
    private readonly repairDriver: RepairDriver;
    private pulse: Observable<any> = Observable.interval(500);

    constructor(eeDriver: EEDriverWithHooks, private oscDriver: OscDriver) {
        this.repairDriver = new RepairDriver(eeDriver, this.pulse);
        this.logic = new RepairLogic(this.repairDriver);

    }

    async init() {
        await this.repairDriver.init();
        await this.logic.init();
        this.subscription = this.pulse.switchMap<any, OscMessage>(_ => {
            const result: OscMessage[] = [];
            for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
                const system1 = this.logic.getSystem1Status(s1);
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
            for (let s2 = 0; s2 < InfraSystem.COUNT; s2++) {
                const system2 = this.logic.getSystem2Status(s2);
                result.push({
                    address: `/d/repairs/${InfraSystem[s2]}/is-error`,
                    args: {type: 'i', value: system2.isError ? 1 : 0}
                }, {
                    address: `/d/repairs/${InfraSystem[s2]}/is-online`,
                    args: {type: 'i', value: system2.isOnline ? 1 : 0}
                }, {
                    address: `/d/repairs/${InfraSystem[s2]}/corruption`,
                    args: {type: 'f', value: system2.corruption}
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
