import {System1, System2} from "./systems";

export class RepairModule {
    private _repairing: string = '';
    private firstLevelSystems: { [systemName: string]: System1 };
    private secondLevelSystems: { [systemName: string]: System2 };

    //private first2secondMap: { [system1Name: string]: System2[] } = {};
    private static readonly second2firstMap: { [system2Name: string]: string[] } = {
        'zeroPointModule': ['reactor', 'beams'],
        'activeCollector': ['beams', 'missile'],
        'polaronLimiter': ['maneuvering', 'impulse', 'jumpDrive'],
        'nanowaveShiftEnergizer': ['frontShield', 'rearShield', 'reactor'],
        'coaxialPlasmaCapacitor': ['missile', 'maneuvering', 'frontShield'],
        'dilithiumParticleGenerator': ['impulse', 'jumpDrive', 'rearShield'],
    };

    constructor() {
        for (let secondarySystem of Object.keys(RepairModule.second2firstMap)) {
            let sys2 = new System2(secondarySystem);
            for (let primarySystem of RepairModule.second2firstMap[secondarySystem]) {
                if (!Object.keys(this.firstLevelSystems).indexOf(primarySystem)) {
                    this.firstLevelSystems[primarySystem] = new System1(primarySystem);
                }
                this.firstLevelSystems[primarySystem].supportingSystems.push(sys2);
                sys2.supportedSystems.push(this.firstLevelSystems[primarySystem]);
            }
            this.secondLevelSystems[secondarySystem] = sys2;
        }
    }

    get repairing(): string {
        return this._repairing;
    }

    startRepairing(sysName: string) {
        if (this._repairing) {
            this.stopRepairing()
        }
        this._repairing = sysName;
        this.firstLevelSystems[sysName].startRepairTicker();
    }

    stopRepairing() {
        if (this._repairing) {
            this.firstLevelSystems[this._repairing].stopRepairTicker();
        }
        this._repairing = '';
    }
}
