import {System1, System2} from "./systems";

export class RepairModule {
    public repairing: System1;

    private firstLevelSystems: System1[];
    private secondLevelSystems: System2[];

    private first2secondMap: { [system1Name: string]: System2[] } = {};
    private second2firstMap: { [system2Name: string]: System1[] } = {};

    constructor() {

    }

}
