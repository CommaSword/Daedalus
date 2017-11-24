import Timer = NodeJS.Timer;
import {ESystem} from "../empty-epsilon/model";
import {InfraSystem} from "./repair";

export class System1 {
    public static readonly maxHealth = 1.0;
    public static readonly maxOverPower = 3.0;
    public static readonly maxSupportedPower = 1.0;
    public static readonly heatOnErrorRate = 1.0;
    public static readonly repairRate = 1.0;

    private _power: number = 0;

    constructor(public id: ESystem, public health: number = System1.maxHealth, public heat_level: number = 0,
                public initPower: number = System1.maxSupportedPower, public coolant: number = 0,
                public supportingSystems: Array<any> = []) {
        //   this.power = initPower;
    }

    get repairRate() {
        if (this.supportingSystems.every(sys => !sys.error)) {
            return System1.repairRate;
        } else {
            return 0.5 * System1.repairRate;
        }
    }

    get heatRate() {
        if (this.supportingSystems.every(sys => !sys.error)) {
            return 0;
        } else {
            return System1.heatOnErrorRate;
        }
    }

    get maxPower() {
        let onlineSystems = this.supportingSystems.filter(sys => sys.isOnline).length;
        if (onlineSystems === this.supportingSystems.length) {
            return System1.maxOverPower;
        } else {
            return onlineSystems / this.supportingSystems.length;
        }
    }

    get power(): number {
        return this._power;
    }

    // set power(newPower: number) {
    //     if (newPower > this.maxPower) {
    //         newPower = this.maxPower;
    //     }
    //     this._power = newPower;
    //     if (this._power > System1.maxSupportedPower) {
    //         for (let sys of this.supportingSystems) {
    //             sys.startCorruptionTicker(this._power - System1.maxSupportedPower);
    //         }
    //     } else {
    //         for (let sys of this.supportingSystems) {
    //             sys.stopCorruption();
    //         }
    //     }
    // }

}


export class System2 {
    public name: string;
    public error: boolean;
    public isOnline: boolean;

    public corruption: number = 0;
    private corruptionRate: number;
    private corruptionThreshold: number;
    private corruptionTicker: Timer;


    private static readonly tickTime = 1000;
    private static readonly baseCorruption = 0.001;

    constructor(public id: InfraSystem, public supportedSystems: System1[] = []) {
        this.name = InfraSystem[id];
        this.shutdown();
    }

    shutdown() {
        this.corruption = 0;
        this.corruptionThreshold = (Math.random() * 100) + 1;
        this.error = false;
        this.isOnline = false;
    }

    startup() {
        this.isOnline = true;
    }

    setError() {
        if (this.isOnline) {
            this.error = true;
        }
    }

    _setError(state: boolean) {
        if (!this.isOnline && state) {
            return;
        }
        if (!state) {
            this.corruption = 0;
        }
        this.setOnline(!state);
        this.error = state;
        for (let sys of this.supportedSystems) {
            //     sys.setRepairRate();
        }
    }

    setOnline(state: boolean) {
        if (!state) {
            this.corruptionThreshold = Math.random();
            if (!this.error) {
                this.corruption = 0;
            }
            this.isOnline = state;
        } else {
            if (!this.error) {
                this.isOnline = state;
            }
        }

    }

    private corruptSystem = () => {
        this.corruption += this.corruptionRate * System2.baseCorruption;
        if (this.corruption >= this.corruptionThreshold) {
            if (this.corruptionTicker) {
                clearInterval(this.corruptionTicker);
            }
            //  this.setError(true);
        }
    };

    startCorruptionTicker(rate: number) {
        if (this.corruptionTicker) {
            clearInterval(this.corruptionTicker);
        }
        this.corruptionRate = rate;
        this.corruptionTicker = setInterval(this.corruptSystem, System2.tickTime);
    }

    stopCorruption() {
        if (this.corruptionTicker) {
            clearInterval(this.corruptionTicker);
        }

    }
}
