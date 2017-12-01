import {Driver, RepairModule} from "./repair";
import {ESystem, ESystemNames} from "../empty-epsilon/model";
import {Observable} from "rxjs/Observable";
import {EEDriverWithHooks} from "../empty-epsilon/driver";

export const repair_per_second = 0.007;
export const heat_per_second = 0.01;

const powerQueries = ESystemNames.map((system) => `getPlayerShip(-1):getSystemPower('${system}')`);

export async function makeRepairDriver(eeDriver: EEDriverWithHooks, pulse: Observable<any>): Promise<Driver> {

    function queryPowerOfAllSystems() {
        return Observable.of(...powerQueries)
            .map(async (query, system) => ({system, power: await eeDriver.query(query)}))
            .mergeMap(msg => Observable.fromPromise(msg));
    }

    // kill the fake repair crew
    eeDriver.command(`getPlayerShip(-1):setRepairCrewCount({0})`, ['0']);
    // eeDriver.command(`getPlayerShip(-1):setAutoCoolant({0})`, ['false']);

    eeDriver.addSystemFeature('RepairRate', `
if value > 0 then
    ship:setSystemHealth(system, math.min(1, ship:getSystemHealth(system) + (value * ${repair_per_second} * delta)))
end
`);

    eeDriver.addSystemFeature('HeatRate', `
if value > 0 then
    ship:setSystemHeat(system, math.min(1, ship:getSystemHeat(system) + (value * ${heat_per_second} * delta)))
end
`);

    eeDriver.addSystemFeature('MaxPower', `
local power = ship:getSystemPower(system)
if power > value then
    ship:setSystemPower(system, value)
end
`);
    return {
        setRepairRate(system: ESystem, repairRate: number): Promise<null> {
            return eeDriver.command(`getPlayerShip(-1):setSystemRepairRate('${ESystem[system]}', {0})`, [repairRate.toFixed(4)]);
        },
        setHeatRate(system: ESystem, heatRate: number): Promise<null> {
            return eeDriver.command(`getPlayerShip(-1):setSystemHeatRate('${ESystem[system]}', {0})`, [heatRate.toFixed(4)]);
        },
        setMaxPower(system: ESystem, maxPower: number): Promise<null> {
            return eeDriver.command(`getPlayerShip(-1):setSystemMaxPower('${ESystem[system]}', {0})`, [maxPower.toFixed(4)]);
        },
        powerUpdates: pulse.mergeMap<any, { system: ESystem, power: number }>(queryPowerOfAllSystems)
    };
}
