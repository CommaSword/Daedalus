import {ObjectDriver, Promise} from "../http-server-driver";
/**
 * Created by amira on 6/3/17.
 */

export abstract class SpaceObject{
    protected abstract readonly driver:ObjectDriver;

    getPosition():Promise<[number, number]>{
        return this.driver.getMultiple(`getPosition()`, 2);
    }
    setPosition(x:number, y:number):Promise<void>{
        return this.driver.set(`setPosition(${x},${y})`);
    }

    /**
     * Gets the rotation of this object. In degrees.
     * 0 degrees is pointing to the right of the world.
     * So this does not match the heading of a ship.
     * The value returned here can also go below 0 degrees or higher then 360 degrees,
     * there is no limiting on the rotation.
     */
    getRotation():Promise<number>{
        return this.driver.get(`getRotation()`);
    }

    /**
     * Sets the absolute rotation of this object. In degrees.
     */
    setRotation(angle:number):Promise<void>{
        return this.driver.set(`setRotation(${angle})`);
    }

    /**
     * Get the heading of this object, in the range of 0 to 360.
     * The heading is 90 degrees off from the rotation.
     */
    getHeading():Promise<number>{
        return this.driver.get(`getHeading()`);
    }

    setHeading(angle:number):Promise<void>{
        return this.driver.set(`setHeading(${angle})`);
    }

    /**
     * Gets the velocity of the object, in 2D space, in meters/second
     */
    getVelocity():Promise<number>{
        return this.driver.get(`getVelocity()`);
    }

    setVelocity(velocity:number):Promise<void>{
        return this.driver.set(`setVelocity(${velocity})`);
    }

    /**
     * Gets the rotational velocity of the object, in degree/second
     */
    getAngularVelocity():Promise<number>{
        return this.driver.get(`getAngularVelocity()`);
    }

    setAngularVelocity(velocity:number):Promise<void>{
        return this.driver.set(`setAngularVelocity(${velocity})`);
    }

    /**
     * Gets the faction name to which this object belongs.
     */
    getFaction():Promise<string>{
        return this.driver.get(`getFaction()`);
    }

    setFaction(faction:string):Promise<void>{
        return this.driver.set(`setFaction(${faction})`);
    }

    /**
     * Gets the rotational velocity of the object, in degree/second
     */
    getFactionId():Promise<number>{
        return this.driver.get(`getFactionId()`);
    }

    setFactionId(factionId:number):Promise<void>{
        return this.driver.set(`setFactionId(${factionId})`);
    }

    setCommsScript(scriptName:number):Promise<void>{
        return this.driver.set(`setCommsScript(${scriptName})`);
    }

    isEnemy(other:SpaceObject){
        return this.driver.get(`isEnemy(${other.driver.contextQuery})`);
    }

}
