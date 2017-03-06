import {PlayerShip} from "./player-ship";

export interface ServerDriver{
    getPlayerShip():PlayerShip;
}
