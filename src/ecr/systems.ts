import {ESystem} from "../empty-epsilon/model";
import {ESwitchBoard} from "./logic";

export interface PrimarySystemStatus {

    readonly id: ESystem;
    readonly repairRate : number;
    readonly heatRate : number;
    readonly maxPower : number;
}


export class PrimarySystem implements PrimarySystemStatus {
    public static readonly maxOverPower = 3.0;
    public static readonly maxSupportedPower = 1.0;
    public static readonly heatOnErrorRate = 1.0;
    public static readonly repairRate = 1.0;

    public power: number = 0;
    public supportingSystems: SwitchBoard[] = [];

    constructor(public id: ESystem) {
    }

    get repairRate() {
        const onlineNoErrorSystems = this.supportingSystems.filter(sys => sys.isOnline && !sys.isError).length;
        switch(onlineNoErrorSystems){
            case 0:
                return PrimarySystem.repairRate * 0.2;
            case 1:
                return PrimarySystem.repairRate * 0.5;
            default:
                return PrimarySystem.repairRate;
        }
    }

    get heatRate() {
        if (this.supportingSystems.every(sys => !sys.isError)) {
            return 0;
        } else {
            return PrimarySystem.heatOnErrorRate;
        }
    }

    get maxPower() {
        let onlineSystems = this.supportingSystems.filter(sys => sys.isOnline).length;
        if (onlineSystems === this.supportingSystems.length) {
            return PrimarySystem.maxOverPower;
        } else {
            return PrimarySystem.maxSupportedPower * onlineSystems / this.supportingSystems.length;
        }
    }

    /**
     * between 0 and 2,  the factor of over-power
     */
    get normalizedOverPower() {
        return Math.max(0, (this.power - PrimarySystem.maxSupportedPower) / PrimarySystem.maxSupportedPower);
    }
}


export interface SwitchBoardStatus {

    readonly id: ESwitchBoard;
    readonly isError: boolean;
    readonly isOnline: boolean;
    readonly overload: number;
    readonly overloadErrorThreshold: number;
}

export class SwitchBoard implements SwitchBoardStatus {
    // say it takes ~3 minutes of ~200% power to cause an error on average
    // so it should take twice to reach maximum overload (1).
    // so overload per milli :
    // 1 / 2 * 3 * 60 * 1000  = 1 / 180000 ~= 0.0000055
    public static readonly overloadPerMillisecond = 0.0000055;
    public static readonly maxOverload = 1;

    public readonly name: string;
    public readonly supportedSystems: PrimarySystem[] = [];
    public isError: boolean;
    public isOnline: boolean;
    public overload: number;
    public overloadErrorThreshold: number;

    constructor(public id: ESwitchBoard) {
        this.name = ESwitchBoard[id];
        this.shutdown();
        this.startup();
    }

    addOverload(delta: number) {
        if (this.isOnline) {
            this.overload = Math.min(SwitchBoard.maxOverload, this.overload + delta);
        }
    }

    shutdown() {
        this.isOnline = false;
        this.isError = false;
        this.overload = 0;
        this.overloadErrorThreshold = Math.max(Math.random() * SwitchBoard.maxOverload, SwitchBoard.overloadPerMillisecond * 1000);
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
