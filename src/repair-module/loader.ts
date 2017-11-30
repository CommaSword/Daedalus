import {Driver, RepairModule} from "./repair";
import {ESystem, ESystemNames} from "../empty-epsilon/model";
import {Observable} from "rxjs/Observable";
import {EEDriver} from "../empty-epsilon/driver";

export const repair_per_second = 0.007;
export const RepairPerMilli = repair_per_second / 1000;

export async function makeRepairDriver(eeDriver: EEDriver, pulse: Observable<any>): Promise<Driver> {

    const powerQueries = ESystemNames.map((system) => `getPlayerShip(-1):getSystemPower('${system}')`);

    function queryPowerOfAllSystems() {
        return Observable.of(...powerQueries)
            .map(async (query, system) => ({system, power: await eeDriver.query(query)}))
            .mergeMap(msg => Observable.fromPromise(msg));
    }

    // TODO move hooks mechanism (init and `table.insert(_G._daedalus_hooks, hook)` ) to EEDriver
    // language=Lua
    await eeDriver.exec(`
_G._daedalus_hooks_lib = Script()
_G._daedalus_hooks_lib:run("_daedalus_hooks_lib.lua")
`);

    // language=Lua
    await eeDriver.exec(`
local ship = getPlayerShip(-1)
if not ship.setSystemMaxPower then
    function ship:setSystemMaxPower(system, maxPower)
        self[system .. '_max_power'] = maxPower;
    end
    
    function enforceMaxPower(system, maxPower)
        if maxPower then
            local power = ship:getSystemPower(system)
            if power > maxPower then
                ship:setSystemPower(system, maxPower)
            end
        end
    end
    function enforce(delta)
        enforceMaxPower('Reactor', ship['Reactor_max_power'])
        enforceMaxPower('BeamWeapons', ship['BeamWeapons_max_power'])
        enforceMaxPower('MissileSystem', ship['MissileSystem_max_power'])
        enforceMaxPower('Maneuver', ship['Maneuver_max_power'])
        enforceMaxPower('Warp', ship['Warp_max_power'])
        enforceMaxPower('JumpDrive', ship['JumpDrive_max_power'])
        enforceMaxPower('Reactor', ship['Reactor_max_power'])
        enforceMaxPower('Reactor', ship['Reactor_max_power'])
        enforceMaxPower('Reactor', ship['Reactor_max_power'])
    
    end
    
    table.insert(_G._daedalus_hooks, enforce)
end
`);

    // language=Lua
    await eeDriver.exec(`
local ship = getPlayerShip(-1)
local repair_per_second = 0.007

if not ship.setRepairRate then
    
    ship:setRepairCrewCount(0)
    
    function ship:setRepairRate(system, repairRate)
        self[system .. '_repair_rate'] = repairRate
    end
    
    function repair(system, repairRate, delta)
        if repairRate and repairRate > 0 then
           ship:setSystemHealth(system, math.min(1, ship:getSystemHealth(system) + (repairRate * repair_per_second * delta)))
        end
    end
    
    function enforce(delta)
        repair('Reactor', ship['Reactor_repair_rate'], delta)
        repair('BeamWeapons', ship['BeamWeapons_repair_rate'], delta)
        repair('MissileSystem', ship['MissileSystem_repair_rate'], delta)
        repair('Maneuver', ship['Maneuver_repair_rate'], delta)
        repair('Warp', ship['Warp_repair_rate'], delta)
        repair('JumpDrive', ship['JumpDrive_repair_rate'], delta)
        repair('Reactor', ship['Reactor_repair_rate'], delta)
        repair('Reactor', ship['Reactor_repair_rate'], delta)
        repair('Reactor', ship['Reactor_repair_rate'], delta)
    
    end

    table.insert(_G._daedalus_hooks, enforce) 
end
`);


    // language=Lua
    await eeDriver.exec(`
local ship = getPlayerShip(-1)
local heat_per_second = 0.007

if not ship.setHeatRate then
    
    function ship:setHeatRate(system, heatRate)
        self[system .. '_heat_rate'] = heatRate
    end
    
    function heat(system, heatRate, delta)
        if heatRate and heatRate > 0 then
           ship:setSystemHeat(system, math.min(1, ship:getSystemHeat(system) + (heatRate * heat_per_second * delta)))
        end
    end
    
    function enforce(delta)
        heat('Reactor', ship['Reactor_heat_rate'], delta)
        heat('BeamWeapons', ship['BeamWeapons_heat_rate'], delta)
        heat('MissileSystem', ship['MissileSystem_heat_rate'], delta)
        heat('Maneuver', ship['Maneuver_heat_rate'], delta)
        heat('Warp', ship['Warp_heat_rate'], delta)
        heat('JumpDrive', ship['JumpDrive_heat_rate'], delta)
        heat('Reactor', ship['Reactor_heat_rate'], delta)
        heat('Reactor', ship['Reactor_heat_rate'], delta)
        heat('Reactor', ship['Reactor_heat_rate'], delta)
    end

    table.insert(_G._daedalus_hooks, enforce) 
end
`);
    return {
        setRepairRate(system: ESystem, repairRate: number): Promise<null> {
            return eeDriver.command(`getPlayerShip(-1):setRepairRate('${ESystem[system]}', {0})`, [repairRate.toFixed(4)]);
        },
        setHeatRate(system: ESystem, heatRate: number): Promise<null> {
            return eeDriver.command(`getPlayerShip(-1):setHeatRate('${ESystem[system]}', {0})`, [heatRate.toFixed(4)]);
        },
        setMaxPower(system: ESystem, maxPower: number): Promise<null> {
            return eeDriver.command(`getPlayerShip(-1):setSystemMaxPower('${ESystem[system]}', {0})`, [maxPower.toFixed(4)]);
        },
        powerUpdates: pulse.mergeMap<any, { system: ESystem, power: number }>(queryPowerOfAllSystems)
    };
}

export async function initRepairModule(driver: EEDriver, pulse: Observable<any>): Promise<RepairModule> {
    return new RepairModule(await makeRepairDriver(driver, pulse));
}
