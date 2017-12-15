import {ESystem} from "../empty-epsilon/model";
import {InfraSystem} from "./logic";

export interface System1Status {

    readonly id: ESystem;
    readonly repairRate : number;
    readonly heatRate : number;
    readonly maxPower : number;
}


export class System1 implements System1Status {
    public static readonly maxOverPower = 3.0;
    public static readonly maxSupportedPower = 1.0;
    public static readonly heatOnErrorRate = 1.0;
    public static readonly repairRate = 1.0;

    public power: number = 0;
    public supportingSystems: System2[] = [];

    constructor(public id: ESystem) {
    }

    get repairRate() {
        const onlineNoErrorSystems = this.supportingSystems.filter(sys => sys.isOnline && !sys.isError).length;
        switch(onlineNoErrorSystems){
            case 0:
                return System1.repairRate * 0.2;
            case 1:
                return System1.repairRate * 0.5;
            default:
                return System1.repairRate;
        }
    }

    get heatRate() {
        if (this.supportingSystems.every(sys => !sys.isError)) {
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
            return System1.maxSupportedPower * onlineSystems / this.supportingSystems.length;
        }
    }

    /**
     * between 0 and 2,  the factor of over-power
     */
    get normalizedOverPower() {
        return Math.max(0, (this.power - System1.maxSupportedPower) / System1.maxSupportedPower);
    }
}


export interface System2Status {

    readonly id: InfraSystem;
    readonly isError: boolean;
    readonly isOnline: boolean;
    readonly overload: number;
    readonly overloadErrorThreshold: number;
}

export class System2 implements System2Status {
    // say it takes ~3 minutes of ~200% power to cause an error on average
    // so it should take twice to reach maximum overload (1).
    // so overload per milli :
    // 1 / 2 * 3 * 60 * 1000  = 1 / 180000 ~= 0.0000055
    public static readonly overloadPerMillisecond = 0.0000055;
    public static readonly maxOverload = 1;

    public readonly name: string;
    public readonly supportedSystems: System1[] = [];
    public isError: boolean;
    public isOnline: boolean;
    public overload: number;
    public overloadErrorThreshold: number;

    constructor(public id: InfraSystem) {
        this.name = InfraSystem[id];
        this.shutdown();
        this.startup();
    }

    addOverload(delta: number) {
        if (this.isOnline) {
            this.overload = Math.min(System2.maxOverload, this.overload + delta);
        }
    }

    shutdown() {
        this.isOnline = false;
        this.isError = false;
        this.overload = 0;
        this.overloadErrorThreshold = Math.max(Math.random() * System2.maxOverload, System2.overloadPerMillisecond * 1000);
    }

    startup() {
        this.isOnline = true;
    }

    setError() {
        if (this.isOnline) {
            this.isError = true;
        }
    }
}
