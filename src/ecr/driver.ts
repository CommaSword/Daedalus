import {EEDriverWithHooks, ESystem, ESystemNames} from "empty-epsilon-js";
import {Observable, from, of} from "rxjs";
import { map, mergeMap } from 'rxjs/operators';

import {Driver} from "./logic";

export const repair_per_second = 0.007;
export const heat_per_second = 0.05 * /* heat_sanity_factor */ 0.28;
const damage_per_second_on_overheat = 0.08;
const min_reactor_health = -0.89;

const powerQueries = ESystemNames.map((system) => `getPlayerShip(-1):getSystemPower('${system}')`);

export class EcrDriver implements Driver {

    private queryPowerOfAllSystems = () => {
        return of(...powerQueries)
            .pipe(map(async (query, system) => ({system, power: await this.eeDriver.query(query) as number})))
            .pipe(mergeMap(msg => from(msg)));
    };

    powerUpdates: Observable<{ system: ESystem; power: number; }>;

    constructor(private eeDriver: EEDriverWithHooks, private pulse: Observable<any>) {
        this.powerUpdates = this.pulse.pipe(mergeMap<any,  Observable<{ system: ESystem, power: number }>>(this.queryPowerOfAllSystems))
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
    local newHeat = ship:getSystemHeat(system) + (value * ${heat_per_second} * delta)
    if newHeat > 1 then
        ${
                /*
                // Heat damage is specified as damage per second while overheating.
                // Calculate the amount of overheat back to a time, and use that to
                // calculate the actual damage taken.
                 */''}
        local newHealth = ship:getSystemHealth(system) - (newHeat -1) * ${damage_per_second_on_overheat / heat_per_second}
        if system == '${ESystem[ESystem.Reactor]}' and newHealth < ${min_reactor_health} then 
            newHealth = ${min_reactor_health}
        end
        ship:setSystemHealth(system, math.max(-1, newHealth))
        newHeat = 1 
    end
    ship:setSystemHeat(system, newHeat)
end
`),
            this.eeDriver.addSystemFeature('MaxPower', `
local power = ship:getSystemPower(system)
if power > value then
    ship:setSystemPower(system, value)
end
`),

            this.eeDriver.exec(`
local ship = getPlayerShip(-1)
if not ship.maxReactorHealth then
    ship.maxReactorHealth = true
    
    function setMaxReactorHealth(delta)
        local health = ship:getSystemHealth('${ESystem[ESystem.Reactor]}')
        if health < ${min_reactor_health} then
            ship:setSystemHealth('${ESystem[ESystem.Reactor]}', ${min_reactor_health})
        end
    end

    table.insert(ship._daedalus_hooks, setMaxReactorHealth) 
end
`)
        ])
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
