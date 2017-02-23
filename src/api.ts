import {Promise} from "axios";

export interface ServerDriver{
    getHull():Promise<number>;
}
