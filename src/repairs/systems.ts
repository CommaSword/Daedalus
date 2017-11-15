export class System1 {
    public name: string;
    public health: number;
    public heat_level: number;
    public coolant: number;
    public static readonly maxHealth = 1.0;

    private _power: number = 0;
    private maxPower: number;
    private repairRate: number;
    private static readonly baseRepairRate = 0.01;
    private static readonly unsupportedMaxPower = 1.0;
    private static readonly absoluteMaxPower = 3.0;
    private supportingSystems: Array<any>;

    constructor(name: string, health: number, temperature: number, initPower: number,
                coolant: number, supportingSystems: Array<any>) {
        this.name = name;
        this.health = health;
        this.heat_level = temperature;
        this.supportingSystems = supportingSystems;
        this.setMaxPower();
        this.power = initPower;
        this.setRepairRate();
        this.coolant = coolant;
    }

    setRepairRate() {
        if (this.supportingSystems.length && this.supportingSystems.filter(sys => sys.error).length) {
            this.repairRate = 0.5 * System1.baseRepairRate;
        } else {
            this.repairRate = System1.baseRepairRate;
        }
    }

    getRepairRate(): number {
        return this.repairRate;
    }


    setMaxPower() {
        let onlineSystems = this.supportingSystems.filter(sys => sys.isOnline).length;
        if (onlineSystems === this.supportingSystems.length) {
            this.maxPower = System1.absoluteMaxPower;
        } else {
            this.maxPower = onlineSystems / this.supportingSystems.length;
        }

        if (this.power > this.maxPower) {
            this.power = this.maxPower;
        }
    }

    get power(): number {
        return this._power;
    }


    set power(newPower: number) {
        if (newPower > this.maxPower) {
            newPower = this.maxPower;
        }
        this._power = newPower;
        if (this._power > System1.unsupportedMaxPower) {
            this.corruptSubSystems(this._power - System1.unsupportedMaxPower);
        }
    }

    corruptSubSystems(step: number) {
        for (let sys of this.supportingSystems) {
            sys.startCorruptionTicker(step);
        }
    }
}


export class System2 {
    public name: string;
    public error: boolean;
    public isOnline: boolean;

    private corruption: number = 0;
    private corruptionRate: number;
    private corruptionThreshold: number;
    private corruptionTicker: number;
    private supportedSystems: System1[];

    private static readonly tickTime = 1000;
    private static readonly baseCorruption = 0.001;

    constructor(name: string, supportedSystems: System1[] = []) {
        this.name = name;
        this.corruptionThreshold = Math.random() * 0.5 + 0.5;
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
        this.setOnline(!state);
        this.error = state;
        for (let sys of this.supportedSystems) {
            sys.setRepairRate();
        }
    }

    setOnline(state: boolean) {
        if (!state) {
            this.corruptionThreshold = Math.random();
            if (!this.error) {
                this.corruption = 0;
            }
            this.isOnline = state;
        } else {
            if (!this.error) {
                this.isOnline = state;
            }
        }

        for (let sys of this.supportedSystems) {
            sys.setMaxPower();
        }
    }

    corruptSystem(rate: number) {
        this.corruption += rate * System2.baseCorruption;
        if (this.corruption >= this.corruptionThreshold) {
            if (this.corruptionTicker) {
                clearInterval(this.corruptionTicker);
            }
            this.setError(true);
        }
    }

    startCorruptionTicker(rate: number) {
        if (this.corruptionTicker) {
            clearInterval(this.corruptionTicker);
        }
        this.corruptionTicker = setInterval(this.corruptSystem(rate), System2.tickTime);
    }

    stopCorruption() {
        if (this.corruptionTicker) {
            clearInterval(this.corruptionTicker);
        }

    }
}
