import {System1, System2} from "./systems";
import {ESystem} from "../empty-epsilon/model";

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

export class System1Status {

    constructor(private s1: System1) {

    }

    get id(): ESystem {
        return this.s1.id;
    }
}

export interface SideEffects {
    setRepairRate(system: ESystem, repairRate: number): void;

    setHeatRate(system: ESystem, repairRate: number): void;

    setMaxPower(system: ESystem, maxPower: number): void;
}

export class RepairModule {

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
    private _repairing: ESystem | null = null;

    constructor(private sideEffects: SideEffects) {
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


    getSystem1Status(id: ESystem): System1Status {
        return new System1Status(this.systems1[id]);
    }

    getSystem2Status(id: InfraSystem): System2 {
        return this.systems2[id];
    }

    get repairing(): ESystem | null {
        return this._repairing;
    }

    setError(id: InfraSystem) {
        this.systems2[id].setError();
        this.systems2[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    shutdown(id: InfraSystem) {
        this.systems2[id].shutdown();
        this.systems2[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateMaxPower(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    startup(id: InfraSystem) {
        this.systems2[id].startup();
        this.systems2[id].supportedSystems.forEach(sys1 => {
            this.updateMaxPower(sys1.id);
        });
    }


    private updateHeatRate(id: ESystem) {
        this.sideEffects.setHeatRate(id, this.systems1[id].heatRate);
    }

    private updateMaxPower(id: ESystem) {
        this.sideEffects.setMaxPower(id, this.systems1[id].maxPower);
    }

    setSystem1Power(id: ESystem, power: number) {

        this.updateRepairRate(id);
    }

    startRepairing(id: ESystem) {
        if (this._repairing === null) {
            this._repairing = id;
            this.updateRepairRate(id);
        } else if (this._repairing !== id) {
            throw new Error(`currently repairing ${ESystem[this._repairing]}`)
        }
    }

    private updateRepairRate(id: ESystem) {
        if (this._repairing === id) {
            this.sideEffects.setRepairRate(id, this.systems1[id].repairRate);
        }
    }

    stopRepairing() {
        if (this._repairing !== null) {
            this.sideEffects.setRepairRate(this._repairing, 0);
            this._repairing = null;
        }
    }

}
