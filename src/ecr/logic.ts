import {PrimarySystemStatus, EcrModel, SwitchBoard, SwitchBoardStatus, ESwitchBoard} from "./model";
import {ESystem} from "empty-epsilon-js";
import {setTimedInterval} from "../core/timing";
import {Observable} from "rxjs/Observable";

export const InfraSystemNames: ReadonlyArray<string> = Array.from(Array(ESwitchBoard.COUNT)).map((_, i) => ESwitchBoard[i]);
export const lowercaseInfraSystemNames: ReadonlyArray<string> = InfraSystemNames.map((_, i) => ESwitchBoard[i].toLowerCase());

export interface Driver {
    setRepairRate(system: ESystem, repairRate: number): Promise<null>;

    setHeatRate(system: ESystem, repairRate: number): Promise<null>;

    setMaxPower(system: ESystem, maxPower: number): Promise<null>;

    powerUpdates: Observable<{ system: ESystem, power: number }>;
}

export class EcrLogic {

    public static readonly tickInterval = 10;
    private disposer: Function;

    constructor(private driver: Driver, private model: EcrModel) {
    }


    get repairing(): ESystem | null {
        return this.model.repairing;
    }

    async init() {
        await Promise.all(Array.from(Array(ESystem.COUNT)).map((_, s1) => this.updateMaxPower(s1)));
        if (this.disposer === undefined) {
            // initiate game loop
            const ticker = setTimedInterval(this.tick.bind(this), EcrLogic.tickInterval);
            // register for power updates
            const subscription = this.driver.powerUpdates.subscribe(msg => this.model.primarySystems[msg.system].power = msg.power);

            this.disposer = () => {
                clearInterval(ticker);
                subscription.unsubscribe();
            };
        }
    }

    /**
     * the "game loop" logic for this module
     * @param {number} delta time (double precision of milliseconds) since lst tick
     */
    tick(delta: number) {
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            if (s1 !== ESystem.Reactor) {
                const system1 = this.model.primarySystems[s1];
                const overPowerFactor = system1.normalizedOverPower;
                if (overPowerFactor) {
                    system1.switchboards.forEach(system2 => this.addOverloadToSwitchBoard(system2.id, delta * SwitchBoard.overloadPerMillisecond * overPowerFactor / system1.switchboards.length))
                }
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
        const system2 = this.model.switchBoards[id];
        system2.addOverload(overload);
        if (system2.overload > system2.overloadErrorThreshold) {
            this.setError(system2.id);
        }
    }

    getPrimarySystemStatus(id: ESystem): PrimarySystemStatus {
        return this.model.primarySystems[id];
    }

    getSwitchBoardStatus(id: ESwitchBoard): SwitchBoardStatus {
        return this.model.switchBoards[id];
    }

    setOverload(id: ESwitchBoard, value: number) {
        const system2 = this.model.switchBoards[id];
        system2.overload = value;
        if (system2.overload > system2.overloadErrorThreshold) {
            this.setError(system2.id);
        }
    }

    setOverloadThreshold(id: ESwitchBoard, value: number) {
        const system2 = this.model.switchBoards[id];
        system2.overloadErrorThreshold = value;
        if (system2.overload > system2.overloadErrorThreshold) {
            this.setError(system2.id);
        }
    }

    /* private */
    setError(id: ESwitchBoard) {
        this.model.switchBoards[id].setError();
        this.updateSupportedSystems(id);
    }

    setHardError(id: ESwitchBoard) {
        this.model.switchBoards[id].setHardError();
        this.updateSupportedSystems(id);
    }

    fixEverything(id: ESwitchBoard) {
        this.model.switchBoards[id].fixEverything();
        this.updateSupportedSystems(id);
    }

    shutdownSwitchBoard(id: ESwitchBoard) {
        this.model.switchBoards[id].shutdown();
        this.updateSupportedSystems(id);
    }

    startupSwitchBoard(id: ESwitchBoard) {
        this.model.switchBoards[id].startup();
        this.updateSupportedSystems(id);
    }

    startRepairingPrimarySystem(id: ESystem) {
        if (this.model.repairing === null) {
            this.model.repairing = id;
            this.updateRepairRate(id);
        } else if (this.model.repairing !== id) {
            throw new Error(`currently repairing ${ESystem[this.model.repairing]}`);
        }
    }

    stopRepairingPrimarySystem() {
        if (this.model.repairing !== null) {
            this.driver.setRepairRate(this.model.repairing, 0);
            this.model.repairing = null;
        }
    }

    private updateSupportedSystems(id: ESwitchBoard) {
        this.model.switchBoards[id].supportedSystems.forEach(sys1 => {
            this.updateHeatRate(sys1.id);
            this.updateMaxPower(sys1.id);
            this.updateRepairRate(sys1.id);
        });
    }

    private async updateHeatRate(id: ESystem) {
        await this.driver.setHeatRate(id, this.model.primarySystems[id].heatRate);
    }

    private async updateMaxPower(id: ESystem) {
        await this.driver.setMaxPower(id, this.model.primarySystems[id].maxPower);
    }

    private async updateRepairRate(id: ESystem) {
        if (this.model.repairing === id) {
            await this.driver.setRepairRate(id, this.model.primarySystems[id].repairRate);
        }
    }

}
