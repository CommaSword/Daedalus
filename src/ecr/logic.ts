import {PrimarySystem, PrimarySystemStatus, SwitchBoard, SwitchBoardStatus} from "./systems";
import {ESystem} from "../empty-epsilon/model";
import {setTimedInterval} from "../core/timing";
import {Observable} from "rxjs/Observable";

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
export const InfraSystemNames : ReadonlyArray<string> = Array.from(Array(ESwitchBoard.COUNT)).map((_, i) => ESwitchBoard[i]);
export const lowercaseInfraSystemNames : ReadonlyArray<string> = InfraSystemNames.map((_, i) => ESwitchBoard[i].toLowerCase());

export interface Driver {
    setRepairRate(system: ESystem, repairRate: number): Promise<null>;

    setHeatRate(system: ESystem, repairRate: number): Promise<null>;

    setMaxPower(system: ESystem, maxPower: number): Promise<null>;

    powerUpdates: Observable<{ system: ESystem, power: number }>;
}


export class EcrLogic {

    public static readonly tickInterval = 10;
    private static readonly switchboardstMap: { [switchId: number]: ESystem[] } = {
        [ESwitchBoard.A1]: [ESystem.Maneuver, ESystem.BeamWeapons],
        [ESwitchBoard.A2]: [ESystem.Impulse, ESystem.BeamWeapons, ESystem.MissileSystem],
        [ESwitchBoard.A3]: [ESystem.Maneuver, ESystem.Impulse, ESystem.JumpDrive],
        [ESwitchBoard.B1]: [ESystem.FrontShield, ESystem.RearShield, ESystem.Reactor],
        [ESwitchBoard.B2]: [ESystem.MissileSystem, ESystem.FrontShield],
        [ESwitchBoard.B3]: [ESystem.Warp, ESystem.JumpDrive, ESystem.RearShield],
    };

    private readonly primarySystems: { [systemName: number]: PrimarySystem } = {};
    private readonly switchBoards: { [systemName: number]: SwitchBoard } = {};
    private disposer: Function;
    private _repairing: ESystem | null = null;

    constructor(private driver: Driver) {
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            this.primarySystems[s1] = new PrimarySystem(s1);
        }
        for (let s2 = 0; s2 < ESwitchBoard.COUNT; s2++) {
            let sys2 = new SwitchBoard(s2);
            for (let s1 of EcrLogic.switchboardstMap[s2]) {
                const system1 = this.primarySystems[s1];
                system1.supportingSystems.push(sys2);
                sys2.supportedSystems.push(system1);
            }
            this.switchBoards[s2] = sys2;
        }
    }


    get repairing(): ESystem | null {
        return this._repairing;
    }

    async init() {
        await Promise.all(Array.from(Array(ESystem.COUNT)).map((_, s1) => this.updateMaxPower(s1)));
        if (this.disposer === undefined) {
            // initiate game loop
            const ticker = setTimedInterval(this.tick.bind(this), EcrLogic.tickInterval);
            // register for power updates
            const subscription = this.driver.powerUpdates.subscribe(msg => this.primarySystems[msg.system].power = msg.power);

            this.disposer = () => {
                clearInterval(ticker);
                subscription.unsubscribe();
            };
        }
    }

    /**
     * the "game loop" logic for this module's state
     * @param {number} delta time (double precision of milliseconds) since lst tick
     */
    tick(delta: number) {
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            const system1 = this.primarySystems[s1];
            const overPowerFactor = system1.normalizedOverPower;
            if (overPowerFactor) {
                system1.supportingSystems.forEach(system2 => this.addOverloadToSwitchBoard(system2.id, delta * SwitchBoard.overloadPerMillisecond * overPowerFactor))
            }
        }
    }

    destroy() {
        if (this.disposer !== undefined) {
            this.disposer();
            delete this.disposer;
        }
    }

    addOverloadToSwitchBoard(id: ESwitchBoard, overload: number) {
        const system2 = this.switchBoards[id];
        system2.addOverload(overload);
        if (system2.overload > system2.overloadErrorThreshold) {
            this.setError(system2.id);
        }
    }

    getPrimarySystemStatus(id: ESystem): PrimarySystemStatus {
        return this.primarySystems[id];
    }

    getSwitchBoardStatus(id: ESwitchBoard): SwitchBoardStatus {
        return this.switchBoards[id];
    }

    setOverload(id: ESwitchBoard, value:number) {
        const system2 = this.switchBoards[id];
        system2.overload = value;
        if (system2.overload > system2.overloadErrorThreshold) {
            this.setError(system2.id);
        }
    }

    setOverloadThreshold(id: ESwitchBoard, value:number) {
        const system2 = this.switchBoards[id];
        system2.overloadErrorThreshold = value;
        if (system2.overload > system2.overloadErrorThreshold) {
            this.setError(system2.id);
        }
    }

    setError(id: ESwitchBoard) {
        this.switchBoards[id].setError();
        this.switchBoards[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    shutdownSwitchBoard(id: ESwitchBoard) {
        this.switchBoards[id].shutdown();
        this.switchBoards[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateMaxPower(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    startupSwitchBoard(id: ESwitchBoard) {
        this.switchBoards[id].startup();
        this.switchBoards[id].supportedSystems.forEach(sys1 => {
            this.updateMaxPower(sys1.id);
        });
    }

    startRepairingPrimarySystem(id: ESystem) {
        if (this._repairing === null) {
            this._repairing = id;
            this.updateRepairRate(id);
        } else if (this._repairing !== id) {
            throw new Error(`currently repairing ${ESystem[this._repairing]}`)
        }
    }

    stopRepairingPrimarySystem() {
        if (this._repairing !== null) {
            this.driver.setRepairRate(this._repairing, 0);
            this._repairing = null;
        }
    }

    private async updateHeatRate(id: ESystem) {
        await this.driver.setHeatRate(id, this.primarySystems[id].heatRate);
    }

    private async updateMaxPower(id: ESystem) {
        await this.driver.setMaxPower(id, this.primarySystems[id].maxPower);
    }

    private async updateRepairRate(id: ESystem) {
        if (this._repairing === id) {
            await this.driver.setRepairRate(id, this.primarySystems[id].repairRate);
        }
    }

}
