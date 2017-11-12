export class System1 {
    public name: string;
    public health: number;
    public temperature: number;
    public coolant: number;

    private energy: number = 0;
    private maxEnergy: number;
    private repairRate: number;
    private static readonly tickTime = 1000;
    private static readonly unsupportedMaxEnergy = 100;
    private static readonly absoluteMaxEnergy = 200;
    private supportingSystems: Array<any>;

    constructor(name: string, health: number, temperature: number, energy: number,
                coolant: number, supportingSystems: Array<any>) {
        this.name = name;
        this.health = health;
        this.temperature = temperature;
        this.supportingSystems = supportingSystems;
        this.setMaxEnergy();
        this.setEnergy(energy);
        this.setRepairRate();
        this.coolant = coolant;
    }

    setRepairRate() {
        if (this.supportingSystems.length && this.supportingSystems.filter(sys => sys.error).length) {
            this.repairRate = 0.5;
        } else {
            this.repairRate = 1.0;
        }
    }

    setMaxEnergy() {
        if (this.supportingSystems.length) {
            this.maxEnergy = 100 * this.supportingSystems.filter(sys => sys.isOnline).length /
                this.supportingSystems.length;
            if (this.maxEnergy === 100) {
                this.maxEnergy = System1.absoluteMaxEnergy;
            }
        } else {
            this.maxEnergy = System1.absoluteMaxEnergy;
        }
        if (this.energy > this.maxEnergy) {
            this.setEnergy(this.maxEnergy);
        }
    }

    setEnergy(energy: number) {
        if (energy > this.maxEnergy) {
            energy = this.maxEnergy;
        }
        this.energy = energy;
        if (this.energy > System1.unsupportedMaxEnergy) {
            this.startCorruptionTicker(this.energy - System1.unsupportedMaxEnergy);
        }
    }

    startCorruptionTicker(step: number) {
        for (let sys of this.supportingSystems) {
            sys.corruptSystem(step);
        }
    }
}


export class System2 {
    public name: string;
    public error: boolean;
    public isOnline: boolean;

    private corruption: number = 0;
    private readonly corruptionThreshold: number;
    private supportedSystems: System1[];

    constructor(name: string, supportedSystems: System1[]) {
        this.name = name;
        this.corruptionThreshold = Math.floor(Math.random() * 101);
        this.supportedSystems = supportedSystems;
        this.error = false;
        this.isOnline = false;
    }

    setError(state: boolean) {
        if (!this.isOnline && state) {
            return;
        }
        if (!state) {
            this.corruption = 0;
        }
        this.isOnline = !state;
        this.error = state;
        for (let sys of this.supportedSystems) {
            sys.setMaxEnergy();
            sys.setRepairRate();
        }
    }

}
