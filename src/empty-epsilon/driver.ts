import {AxiosInstance, AxiosResponse, default as Axios} from "axios";

class Command {

    constructor(public setter: string,
                public value: string,
                public resolver: Function,
                public promise: Promise<any>) {
    }
    get luaCommand(){
        return `${this.setter}(${this.value});`;
    }
}

class Query {
    public symbols: string[];
    public luaQuery: string;
    public luaJSONFields: string;

    constructor(private numberOfResults: number,
                public resolver: Function,
                public getter: string,
                uniqueId: string,
                public promise: Promise<any>) {
        this.symbols = this.numberOfResults > 1 ? Array.from(Array(this.numberOfResults)).map((_, i) => uniqueId + '_' + i) : [uniqueId];
        this.luaQuery = `local ${this.symbols.join(',')} = ${this.getter}; `;
        this.luaJSONFields = this.symbols.map(s => `${s} = ${s}`).join(',');
    }

}

/**
 * internal object for any http communication with game server
 */
export class HttpDriver {
    private static readonly minTimeBetweenFlushes = 50;
    private http: AxiosInstance;
    private getMap: { [getter: string]: Query } = {};
    private setMap: { [setter: string]: Command } = {};
    private isFlushing = false;

    constructor(baseURL: string) {
        this.http = Axios.create({baseURL});
    }

    /**
     * flush all commands to the game server
     * at most, only a single flush is active at each point in time
     * at least `HttpDriver.minTimeBetweenFlushes` milliseconds will puss between the end of one flush and the beginning of the other
     * @returns {Promise<void>}
     */
    private flush = async () => {
        const getMap = this.getMap;
        const setMap = this.setMap;
        this.getMap = {};
        this.setMap = {};
        id = 0;
        const getQueue = Object.keys(getMap).map(q => getMap[q]);
        const setQueue = Object.keys(setMap).map(q => setMap[q]);
        try {
            const script = `
${setQueue.map(cmd => cmd.luaCommand).join('\n')}
${getQueue.map(req => req.luaQuery).join('\n')}
return {${getQueue.map(req => req.luaJSONFields).join(',')}};`;
            if (Object.keys(setMap).length) {
                console.log(`executing ${Object.keys(setMap).length} commands`);
            }
            const res: AxiosResponse = await this.http.request({
                timeout: 3 * 1000,
                method: 'post',
                url: '/exec.lua',
                data: script,
                transformResponse: JSON.parse
            });
            if (res.data.ERROR) {
                console.error('error from game server: ' + res.data.ERROR);
            } else {
                getQueue.forEach((req, i) => req.resolver(req.symbols.map(s => res.data[s])));
                Object.keys(setMap).forEach(s => setMap[s].resolver(null));
            }
        } catch (e) {
            Object.keys(getMap).forEach(s => {
                this.getMap[s] ? this.getMap[s].promise.then(getMap[s].resolver as any) : (this.getMap[s] = getMap[s])
            });
            Object.keys(setMap).forEach(s => {
                this.setMap[s] || (this.setMap[s] = setMap[s])
            });
        } finally {
            this.isFlushing = false;
            if (Object.keys(this.getMap).length || Object.keys(this.setMap).length) {
                this.requestFlush();
            }
        }
    };

    /**
     * simple getter for a single value
     * @param {string} getter
     * @returns {Promise<T>}
     */
    getBuffered<T>(getter: string): Promise<T>;
    /**
     * getter for any number of values. result will always be an array
     * @param {string} getter
     * @param {number} numberOfResults
     * @returns {Promise<T extends Array<any>>}
     */
    getBuffered<T extends Array<any>>(getter: string, numberOfResults: number): Promise<T>;
    getBuffered<T>(getter: string, numberOfResults?: number): Promise<T> {
        const pendingQuery = this.getMap[getter];
        if (pendingQuery) {
            return pendingQuery.promise;
        } else {
            let resolver: Function = null as any;
            const resultPromise = new Promise<T>(resolve => resolver = resolve)
            // if numberOfResults is a number (even if it's 1) return an array
            const resultHandler = (typeof numberOfResults === 'number') ? resolver : (resArr: Array<T>) => resolver(resArr[0]);

            this.requestFlush();
            const req: Query = new Query(numberOfResults || 1, resultHandler, getter, 'r' + (id++), resultPromise);
            this.getMap[getter] = req;
            return resultPromise;
        }
    }

    setToValueBuffered(setter: string, value: string): Promise<null> {
        let existingSet = this.setMap[setter];
        if (existingSet) {
            existingSet.value = value;
            return existingSet.promise;
        } else {
            let resolver: Function = null as any;
            const promise = new Promise<null>(resolve => resolver = resolve);
            this.setMap[setter] = new Command(setter, value, resolver, promise);
            this.requestFlush();
            return promise;
        }
    }

    private requestFlush() {
        if (Object.keys(this.getMap).length + Object.keys(this.setMap).length > 3) {
            this.flush();
        } else if (!this.isFlushing) {
            setTimeout(this.flush, HttpDriver.minTimeBetweenFlushes);
            this.isFlushing = true;
        }
    }
}

let id = 0;
