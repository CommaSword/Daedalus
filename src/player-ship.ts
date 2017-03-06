import {Promise, HttpDriver} from "./http-server-driver";

export class PlayerShip {
    private contextGetter: string;

    constructor(private driver:HttpDriver, index:number){
        this.contextGetter = `getPlayerShip(${index})`;
    }

    getHull():Promise<number>{
        return this.driver.get(`getHull()`, this.contextGetter);
    }

    setHull(number: number):Promise<void> {
        return this.driver.set(`setHull(${number})`, this.contextGetter);
    }

}
