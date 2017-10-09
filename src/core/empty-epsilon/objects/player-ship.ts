import {ObjectDriver} from "../driver";
import {SpaceShip} from "./space-ship";

export class PlayerShip extends SpaceShip {

    constructor(protected driver: ObjectDriver) {
        super();
    }

}
