import Timer = NodeJS.Timer;

export class System1 {
    public name: string;
    public health: number;
    public heat_level: number;
    public coolant: number;
    public static readonly maxHealth = 1.0;
    public static readonly absoluteMaxPower = 3.0;
    public static readonly unsupportedMaxPower = 1.0;
    public supportingSystems: Array<any>;

    private _power: number = 0;
    private maxPower: number;
    private repairRate: number;
    private repairTicker: Timer;
    private static readonly baseRepairRate = 0.01;
    private static readonly tickTime = 1000;



    constructor(name: string, health: number = System1.maxHealth, heat_level: number = 0,
                initPower: number = System1.unsupportedMaxPower, coolant: number = 0,
                supportingSystems: Array<any> = []) {
        this.name = name;
        this.health = health;
        this.heat_level = heat_level;
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
            for (let sys of this.supportingSystems) {
                sys.startCorruptionTicker(this._power - System1.unsupportedMaxPower);
            }
        } else {
            for (let sys of this.supportingSystems) {
                sys.stopCorruption();
            }
        }
    }

    private repairSystem = () => {
        this.health += this.repairRate;
        if (this.health >= System1.maxHealth) {
            this.health = System1.maxHealth;
            clearInterval(this.repairTicker);
        }
    };

    startRepairTicker() {
        this.repairTicker = setInterval(this.repairSystem, System1.tickTime);
    }

    stopRepairTicker() {
        clearInterval(this.repairTicker);
    }
}


export class System2 {
    public name: string;
    public error: boolean;
    public isOnline: boolean;
    public supportedSystems: System1[];

    private corruption: number = 0;
    private corruptionRate: number;
    private corruptionThreshold: number;
    private corruptionTicker: Timer;


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

    private corruptSystem = () => {
        this.corruption += this.corruptionRate * System2.baseCorruption;
        if (this.corruption >= this.corruptionThreshold) {
            if (this.corruptionTicker) {
                clearInterval(this.corruptionTicker);
            }
            this.setError(true);
        }
    };

    startCorruptionTicker(rate: number) {
        if (this.corruptionTicker) {
            clearInterval(this.corruptionTicker);
        }
        this.corruptionRate = rate;
        this.corruptionTicker = setInterval(this.corruptSystem, System2.tickTime);
    }

    stopCorruption() {
        if (this.corruptionTicker) {
            clearInterval(this.corruptionTicker);
        }

    }
}
