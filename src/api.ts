import {PlayerShip} from "./objects/player-ship";

export interface ServerDriver{
    getPlayerShip():PlayerShip;
}
