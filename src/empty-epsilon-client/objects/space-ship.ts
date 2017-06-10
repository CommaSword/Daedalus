import {SpaceObject} from "./space-object";
import {Promise, ObjectDriver} from "../driver";

export abstract class SpaceShip extends SpaceObject {
    protected abstract readonly driver: ObjectDriver;

    getHull(): Promise<number> {
        return this.driver.get(`getHull()`);
    }

    setHull(number: number): Promise<void> {
        return this.driver.set(`setHull(${number})`);
    }

    getSystemHealth(system: ESystem): Promise<number> {
        return this.driver.get(`getSystemHealth(${system})`);
    }

    setSystemHealth(system: ESystem, health: number): Promise<void> {
        return this.driver.set(`setSystemHealth(${system}, ${health})`);
    }

    /*
     SpaceShip:getSystemHeat(ESystem system)
     SpaceShip:setSystemHeat(ESystem system, float heat)
     SpaceShip:getSystemPower(ESystem system)
     SpaceShip:setSystemPower(ESystem system, float power)
     SpaceShip:getSystemCoolant(ESystem system)
     SpaceShip:setSystemCoolant(ESystem system, float coolant)
     */

}


export enum ESystem {
    None = -1,
    Reactor = 0,
    BeamWeapons,
    MissileSystem,
    Maneuver,
    Impulse,
    Warp,
    JumpDrive,
    FrontShield,
    RearShield,
    COUNT
}
