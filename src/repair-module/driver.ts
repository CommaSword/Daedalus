import {Driver} from "./logic";
import {ESystem, ESystemNames} from "../empty-epsilon/model";
import {Observable} from "rxjs/Observable";
import {EEDriverWithHooks} from "../empty-epsilon/driver";

export const repair_per_second = 0.007;
export const heat_per_second = 0.01;

const powerQueries = ESystemNames.map((system) => `getPlayerShip(-1):getSystemPower('${system}')`);


export class RepairDriver implements Driver {

    private queryPowerOfAllSystems = () => {
        return Observable.of(...powerQueries)
            .map(async (query, system) => ({system, power: await this.eeDriver.query(query)}))
            .mergeMap(msg => Observable.fromPromise(msg));
    };

    powerUpdates: Observable<{ system: ESystem; power: number; }>;

    constructor(private eeDriver: EEDriverWithHooks, private pulse: Observable<any>) {
        this.powerUpdates = this.pulse.mergeMap<any, { system: ESystem, power: number }>(this.queryPowerOfAllSystems)
    }

    async init() {
        await Promise.all([
            // kill the fake repair crew
            this.eeDriver.command(`getPlayerShip(-1):setRepairCrewCount({0})`, ['0']),
            // eeDriver.command(`getPlayerShip(-1):setAutoCoolant({0})`, ['false']);

            this.eeDriver.addSystemFeature('RepairRate', `
if value > 0 then
    ship:setSystemHealth(system, math.min(1, ship:getSystemHealth(system) + (value * ${repair_per_second} * delta)))
end
`),
            this.eeDriver.addSystemFeature('HeatRate', `
if value > 0 then
    ship:setSystemHeat(system, math.min(1, ship:getSystemHeat(system) + (value * ${heat_per_second} * delta)))
end
`),
            this.eeDriver.addSystemFeature('MaxPower', `
local power = ship:getSystemPower(system)
if power > value then
    ship:setSystemPower(system, value)
end
`)])
    }

    setRepairRate(system: ESystem, repairRate: number): Promise<null> {
        return this.eeDriver.command(`getPlayerShip(-1):setSystemRepairRate('${ESystem[system]}', {0})`, [repairRate.toFixed(4)]);
    }

    setHeatRate(system: ESystem, heatRate: number): Promise<null> {
        return this.eeDriver.command(`getPlayerShip(-1):setSystemHeatRate('${ESystem[system]}', {0})`, [heatRate.toFixed(4)]);
    }

    setMaxPower(system: ESystem, maxPower: number): Promise<null> {
        return this.eeDriver.command(`getPlayerShip(-1):setSystemMaxPower('${ESystem[system]}', {0})`, [maxPower.toFixed(4)]);
    }

}
