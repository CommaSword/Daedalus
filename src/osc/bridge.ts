import {EventEmitter} from 'eventemitter3';

interface Query {
    query: string;
    type: string;
}

export class OscBridge {
    private driver: any;
    private emitter: EventEmitter;

    public constructor(driver: any) {
        this.driver = driver;
        this.emitter = new EventEmitter();
    }

    public cast(address: string, pollTime = 100) {
        const q: Query | null = this.generateQuery(address);
        if (!q) {
            return;
        }
        this.emitter.on('cast', () => {
            this.driver.get(q.query);
        });
        setInterval(() => {
            this.emitter.emit('cast');
        }, pollTime)
    }

    //untested
    // public cast(address: string, pollTime = 100) {
    //     const q: Query | null = this.generateQuery(address);
    //     if (!q) {
    //         return;
    //     }
    //     this.emitter.on('cast', async () => {
    //         const value = await this.driver.get(q.query);
    //         const message = {
    //             address,
    //             value,
    //             type: q.type
    //         }
    //         // TODO broadcast message
    //     });
    //     setInterval(() => {
    //         this.emitter.emit('cast');
    //     }, pollTime)
    // }

    private generateQuery(address: string): Query | null {
        const vals = address.split('/');
        if (vals[0] !== 'ee') {
            return null;
        }
        let i = 1;
        let commands: string[] = [];
        let commandType = 'string';

        while (i < vals.length) {
            if (isMethod(vals[i])) {
                const method = getMethod(vals[i]);
                commandType = method.type;
                commands.push(`${method.name}(${vals.slice(i + 1, i + method.argNum + 1).join(',')})`);
                i = i + method.argNum + 1;
            } else {
                i++;
            }
        }
        return {
            query: commands.join(':'),
            type: commandType
        }
    }
}

function isMethod(name: string) {
    return !!methods[name];
}

function getMethod(name: string) {
    return methods[name];
}

const methods: any = {
    playership: {
        name: 'getPlayerShip',
        argNum: 1,
        type: 'ship'
    },
    hull: {
        name: 'getHull',
        argnum: 0,
        type: 'number'
    }
};


// Input: ee/playership/-1/hull
// Output: getPlayerShip(-1):getHull()
// value = await driver.query('getPlayerShip(-1):getHull()');
// this.cast({
//     address: address,
//     value: value,
//     type: number //The type is from the last call
// })

//driver.get('getPlayerShip(-1)','getHull()')
