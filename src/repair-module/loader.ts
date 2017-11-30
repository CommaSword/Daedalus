import {Driver, RepairModule} from "./repair";
import {ESystem, ESystemNames} from "../empty-epsilon/model";
import {Observable} from "rxjs/Observable";
import {EEDriver} from "../empty-epsilon/driver";


export async function makeRepairDriver(eeDriver: EEDriver, pulse: Observable<any>, shipGetter = 'getPlayerShip(-1)'): Promise<Driver> {

    const powerQueries = ESystemNames.map((system) => `${shipGetter}:getSystemPower('${system}')`);

    function queryPowerOfAllSystems() {
        return Observable.of(...powerQueries)
            .map(async (query, system) => ({system, power: await eeDriver.query(query)}))
            .mergeMap(msg => Observable.fromPromise(msg));
    }

    // TODO modve hooks mechanism (init and `table.insert(_G._daedalus_hooks, hook)` ) to EEDriver
    // language=Lua
    await eeDriver.exec(`
_G._daedalus_hooks_lib = Script()
_G._daedalus_hooks_lib:run("_daedalus_hooks_lib.lua")
`);

    // language=Lua
    await eeDriver.exec(`
local ship = ${shipGetter}
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
    return {
        setRepairRate(system: ESystem, repairRate: number): Promise<null> {
            return Promise.resolve(null);

        },
        setHeatRate(system: ESystem, repairRate: number): Promise<null> {
            return Promise.resolve(null);

        },
        setMaxPower(system: ESystem, maxPower: number): Promise<null> {
            return eeDriver.command(`${shipGetter}:setSystemMaxPower('${ESystem[system]}', {0})`, [maxPower.toFixed(4)]);
        },
        powerUpdates: pulse.mergeMap<any, { system: ESystem, power: number }>(queryPowerOfAllSystems)
    };
}

export async function initRepairModule(driver: EEDriver, pulse: Observable<any>, shipGetter = 'getPlayerShip(-1)'): Promise<RepairModule> {
    return new RepairModule(await makeRepairDriver(driver, pulse, shipGetter));
}
