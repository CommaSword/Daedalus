import {EEDriverWithHooks} from "../empty-epsilon/driver";
import {Observable} from "rxjs/Observable";
import {RepairDriver} from "./driver";
import {RepairLogic} from "./logic";

export class RepairModule {
    logic: RepairLogic;
    repairDriver: RepairDriver;
    private pulse: Observable<any> = Observable.interval(500);

    constructor(eeDriver: EEDriverWithHooks) {
        this.repairDriver = new RepairDriver(eeDriver, this.pulse);
        this.logic = new RepairLogic(this.repairDriver);

    }


    async init() {
        await this.repairDriver.init();
        await this.logic.init();
    }

    destroy() {
         this.logic.destroy();
    }
}
