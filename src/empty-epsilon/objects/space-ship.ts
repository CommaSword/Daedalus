import {SpaceObject} from "./space-object";
import {ObjectDriver} from "../driver";

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

    getSystemHeat(system: ESystem): Promise<number> {
        return this.driver.get(`getSystemHeat(${system})`);
    }

    setSystemHeat(system: ESystem, health: number): Promise<void> {
        return this.driver.set(`setSystemHeat(${system}, ${health})`);
    }

    /*
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
