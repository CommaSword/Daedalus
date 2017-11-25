import {ESystem} from "../empty-epsilon/model";
import {InfraSystem} from "./repair";

export interface System1Status {

    readonly id: ESystem;
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

    /**
     * between 0 and 2,  the factor of over-power
     */
    get normalizedOverPower() {
        return Math.max(0, (this.power - System1.maxSupportedPower) / System1.maxSupportedPower);
    }
}


export interface System2Status {

    readonly id: InfraSystem;
    readonly corruption: number;
}

export class System2 implements System2Status {

    public static readonly corruptionPerMillisecond = 0.01;
    public static readonly maxCorruption = 1;

    public readonly name: string;
    public readonly supportedSystems: System1[] = []
    public error: boolean;
    public isOnline: boolean;
    public corruption: number;
    private corruptionErrorThreshold: number;

    constructor(public id: InfraSystem) {
        this.name = InfraSystem[id];
        this.shutdown();
    }

    addCorruption(delta: number) {
        if (this.isOnline) {
            this.corruption = this.corruption + delta;
            if (this.corruption > this.corruptionErrorThreshold) {
                this.setError();
            }
        }
    }

    shutdown() {
        this.isOnline = false;
        this.error = false;
        this.corruption = 0;
        this.corruptionErrorThreshold = Math.max(Math.random() * System2.maxCorruption, System2.corruptionPerMillisecond);
    }

    startup() {
        this.isOnline = true;
    }

    setError() {
        if (this.isOnline) {
            this.error = true;
        }
    }
}
