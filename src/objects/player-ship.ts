import {Promise, ObjectDriver} from "../http-server-driver";
import {SpaceShip} from "./space-ship";

export class PlayerShip extends SpaceShip {

    constructor(protected driver:ObjectDriver){
        super();
    }

    getHull():Promise<number>{
        return this.driver.get(`getHull()`);
    }

    setHull(number: number):Promise<void> {
        return this.driver.set(`setHull(${number})`);
    }

}
