import {ObjectDriver} from "../http-server-driver";
import {SpaceObject} from "./space-object";

export abstract class SpaceShip extends SpaceObject{
    protected abstract readonly driver:ObjectDriver;

}



