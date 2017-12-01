import {System1, System1Status, System2, System2Status} from "./systems";
import {ESystem} from "../empty-epsilon/model";
import {setTimedInterval} from "../core/timing";
import {Observable} from "rxjs/Observable";

export enum InfraSystem {
    None = -1,
    zeroPointModule = 0,
    activeCollector,
    polaronLimiter,
    nanowaveShiftEnergizer,
    coaxialPlasmaCapacitor,
    dilithiumParticleGenerator,
    COUNT
}

export interface Driver {
    setRepairRate(system: ESystem, repairRate: number): Promise<null>;

    setHeatRate(system: ESystem, repairRate: number): Promise<null>;

    setMaxPower(system: ESystem, maxPower: number): Promise<null>;

    powerUpdates: Observable<{ system: ESystem, power: number }>;
}


export class RepairModule {

    public static readonly tickInterval = 10;
    private static readonly second2firstMap: { [system2Name: number]: ESystem[] } = {
        [InfraSystem.zeroPointModule]: [ESystem.Maneuver, ESystem.BeamWeapons],
        [InfraSystem.activeCollector]: [ESystem.Impulse, ESystem.BeamWeapons, ESystem.MissileSystem],
        [InfraSystem.polaronLimiter]: [ESystem.Maneuver, ESystem.Impulse, ESystem.JumpDrive],
        [InfraSystem.nanowaveShiftEnergizer]: [ESystem.FrontShield, ESystem.RearShield, ESystem.Reactor],
        [InfraSystem.coaxialPlasmaCapacitor]: [ESystem.MissileSystem, ESystem.FrontShield],
        [InfraSystem.dilithiumParticleGenerator]: [ESystem.Impulse, ESystem.JumpDrive, ESystem.RearShield],
    };

    private readonly systems1: { [systemName: number]: System1 } = {};
    private readonly systems2: { [systemName: number]: System2 } = {};
    private disposer: Function;
    private _repairing: ESystem | null = null;

    constructor(private driver: Driver) {
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            this.systems1[s1] = new System1(s1);
        }
        for (let s2 = 0; s2 < InfraSystem.COUNT; s2++) {
            let sys2 = new System2(s2);
            for (let s1 of RepairModule.second2firstMap[s2]) {
                const system1 = this.systems1[s1];
                system1.supportingSystems.push(sys2);
                sys2.supportedSystems.push(system1);
            }
            this.systems2[s2] = sys2;
        }

        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            this.updateMaxPower(s1);
        }
    }


    get repairing(): ESystem | null {
        return this._repairing;
    }

    init() {
        if (this.disposer === undefined) {
            // initiate game loop
            const ticker = setTimedInterval(this.tick.bind(this), RepairModule.tickInterval);
            // register for power updates
            const subscription = this.driver.powerUpdates.subscribe(msg => this.systems1[msg.system].power = msg.power);

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
            const system1 = this.systems1[s1];
            const overPowerFactor = system1.normalizedOverPower;
            if (overPowerFactor) {
                system1.supportingSystems.forEach(system2 => this.addCorruptionToSystem2(system2.id, delta * System2.corruptionPerMillisecond * overPowerFactor))
            }
        }
    }

    destroy() {
        if (this.disposer !== undefined) {
            this.disposer();
            delete this.disposer;
        }
    }

    addCorruptionToSystem2(id: InfraSystem, corruption: number) {
        const system2 = this.systems2[id]
        system2.addCorruption(corruption);
        if (system2.corruption > system2.corruptionErrorThreshold) {
            this.setError(system2.id);
        }
    }

    getSystem1Status(id: ESystem): System1Status {
        return this.systems1[id];
    }

    getSystem2Status(id: InfraSystem): System2Status {
        return this.systems2[id];
    }

    setError(id: InfraSystem) {
        this.systems2[id].setError();
        this.systems2[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    shutdownSystem2(id: InfraSystem) {
        this.systems2[id].shutdown();
        this.systems2[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateMaxPower(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    startupSystem2(id: InfraSystem) {
        this.systems2[id].startup();
        this.systems2[id].supportedSystems.forEach(sys1 => {
            this.updateMaxPower(sys1.id);
        });
    }

    startRepairingSystem1(id: ESystem) {
        if (this._repairing === null) {
            this._repairing = id;
            this.updateRepairRate(id);
        } else if (this._repairing !== id) {
            throw new Error(`currently repairing ${ESystem[this._repairing]}`)
        }
    }

    stopRepairingSystem1() {
        if (this._repairing !== null) {
            this.driver.setRepairRate(this._repairing, 0);
            this._repairing = null;
        }
    }

    private updateHeatRate(id: ESystem) {
        this.driver.setHeatRate(id, this.systems1[id].heatRate);
    }

    private updateMaxPower(id: ESystem) {
        this.driver.setMaxPower(id, this.systems1[id].maxPower);
    }

    private updateRepairRate(id: ESystem) {
        if (this._repairing === id) {
            this.driver.setRepairRate(id, this.systems1[id].repairRate);
        }
    }

}
