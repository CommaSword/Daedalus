import {ESystem} from "../empty-epsilon/model";

export interface PrimarySystemStatus {

    readonly id: ESystem;
    readonly repairRate: number;
    readonly heatRate: number;
    readonly maxPower: number;
}

export class PrimarySystem implements PrimarySystemStatus {
    public static readonly maxOverPower = 3.0;
    public static readonly maxSupportedPower = 1.0;
    public static readonly heatOnErrorRate = 1.0;
    public static readonly repairRate = 1.0;

    public power: number = 0;

    constructor(public id: ESystem, public switchboards: ReadonlyArray<SwitchBoard>) {
    }

    get repairRate() {
        const onlineNoErrorSystems = this.switchboards.filter(sys => sys.isOnline && !sys.isError).length;
        switch (onlineNoErrorSystems) {
            case 0:
                return PrimarySystem.repairRate * 0.2;
            case 1:
                return PrimarySystem.repairRate * 0.5;
            default:
                return PrimarySystem.repairRate;
        }
    }

    get heatRate() {
        const onlineNoErrorSystems = this.switchboards.filter(sys => sys.isOnline && !sys.isError).length;
        const errorSystems = this.switchboards.filter(sys => sys.isError).length;
        if (errorSystems && (errorSystems >= onlineNoErrorSystems)) {
            return PrimarySystem.heatOnErrorRate;
        } else {
            return 0;
        }
        // if (this.switchboards.every(sys => !sys.isError)) {
        //     return 0;
        // } else {
        //     return PrimarySystem.heatOnErrorRate;
        // }
    }

    get maxPower() {
        let onlineSystems = this.switchboards.filter(sys => sys.isOnline).length;
        if (onlineSystems === this.switchboards.length) {
            return PrimarySystem.maxOverPower;
        } else {
            return PrimarySystem.maxSupportedPower * onlineSystems / this.switchboards.length;
        }
    }

    /**
     * between 0 and 2,  the factor of over-power
     */
    get normalizedOverPower() {
        return Math.max(0, (this.power - PrimarySystem.maxSupportedPower) / PrimarySystem.maxSupportedPower);
    }
}

export enum ESwitchBoard {
    None = -1,
    A1 = 0,
    A2,
    A3,
    B1,
    B2,
    B3,
    COUNT
}


export interface SwitchBoardStatus {

    readonly id: ESwitchBoard;
    readonly isError: boolean;
    readonly isOnline: boolean;
    readonly overload: number;
    readonly overloadErrorThreshold: number;
}

export interface SwitchBoardState {
    readonly name: string;
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

    public readonly supportedSystems: PrimarySystem[] = [];
    public isError: boolean;
    public isOnline: boolean;
    public overload: number;
    public overloadErrorThreshold: number;

    constructor(public id: ESwitchBoard) {
        this.shutdown();
        this.startup();
    }

    get name() {
        return ESwitchBoard[this.id];
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

    toJSON(): SwitchBoardState {
        return {
            name: this.name,
            isError: this.isError,
            isOnline: this.isOnline,
            overload: this.overload,
            overloadErrorThreshold: this.overloadErrorThreshold,
        }
    }

    fromJSON(state: SwitchBoardState) {
        this.isError = state.isError;
        this.isOnline = state.isOnline;
        this.overload = state.overload;
        this.overloadErrorThreshold = state.overloadErrorThreshold;
    }
}

const switchboardstMap: { [switchId: number]: ESystem[] } = {
    [ESwitchBoard.A1]: [ESystem.MissileSystem, ESystem.FrontShield, ESystem.Reactor],
    [ESwitchBoard.A2]: [ESystem.BeamWeapons, ESystem.Warp, ESystem.Reactor, ESystem.Impulse],
    [ESwitchBoard.A3]: [ESystem.Maneuver, ESystem.Impulse, ESystem.RearShield],
    [ESwitchBoard.B1]: [ESystem.FrontShield, ESystem.BeamWeapons, ESystem.Reactor],
    [ESwitchBoard.B2]: [ESystem.Warp, ESystem.Impulse, ESystem.RearShield],
    [ESwitchBoard.B3]: [ESystem.MissileSystem, ESystem.Maneuver, ESystem.Impulse, ESystem.Reactor],
};

export interface EcrState {
    repairing: ESystem | null;
    switchBoards: Array<SwitchBoardState>;
}

export class EcrModel {

    readonly primarySystems: { [systemName: number]: PrimarySystem } = {};
    readonly switchBoards: { [systemName: number]: SwitchBoard } = {};
    repairing: ESystem | null = null;

    constructor() {
        const connections: { [systemName: number]: Array<SwitchBoard> } = {};
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            connections[s1] = [];
            this.primarySystems[s1] = new PrimarySystem(s1, connections[s1]);
        }
        for (let s2 = 0; s2 < ESwitchBoard.COUNT; s2++) {
            let sys2 = new SwitchBoard(s2);
            for (let s1 of switchboardstMap[s2]) {
                const system1 = this.primarySystems[s1];
                connections[s1].push(sys2);
                sys2.supportedSystems.push(system1);
            }
            this.switchBoards[s2] = sys2;
        }
    }

    toJSON(): EcrState {
        return {
            repairing: this.repairing,
            switchBoards: Array.from(Array(ESwitchBoard.COUNT)).map((_, sb) => this.switchBoards[sb].toJSON()),
        };
    }

    fromJSON(state: EcrState) {
        this.repairing = state.repairing;
        for (let sb = 0; sb < ESwitchBoard.COUNT; sb++) {
            if (this.switchBoards[sb].name === state.switchBoards[sb].name) {
                this.switchBoards[sb].fromJSON(state.switchBoards[sb]);
            } else {
                throw new Error(`at index ${sb}, object ${this.switchBoards[sb].name} but state name is ${state.switchBoards[sb].name}`)
            }
        }
    }
}