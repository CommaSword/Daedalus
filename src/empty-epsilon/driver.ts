import {AxiosInstance, AxiosResponse, default as Axios} from "axios";
import format = require("string-template");

class Command {

    constructor(private template: string,
                private values: Array<string>,
                public resolver: Function,
                public promise: Promise<any>) {
    }
    setValues(newValues: Array<string>){
        this.values = newValues;
    }
    get luaCommand(){
        return format(this.template, this.values);
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


let id = 0;

/**
 * internal object for any http communication with game server
 */
export class HttpDriver {
    private static readonly minTimeBetweenFlushes = 10;
    private static readonly maxNumberOfResults = 15; // at around 25-29 the game server kills sockets
    private http: AxiosInstance;
    private pendingQueries: { [getter: string]: Query } = {};
    private pendingCommands: { [setter: string]: Command } = {};
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
        const getMap = this.pendingQueries;
        const setMap = this.pendingCommands;
        this.pendingQueries = {};
        this.pendingCommands = {};
        id = 0;
        const getQueue = Object.keys(getMap).map(q => getMap[q]);
        const setQueue = Object.keys(setMap).map(q => setMap[q]);
        try {
            const script = `
${setQueue.map(cmd => cmd.luaCommand).join('\n')}
${getQueue.map(req => req.luaQuery).join('\n')}
return {${getQueue.map(req => req.luaJSONFields).join(',')}};`;
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
            console.error('error communicating with game server: ' + e.message);
            Object.keys(getMap).forEach(s => {
                this.pendingQueries[s] ? this.pendingQueries[s].promise.then(getMap[s].resolver as any) : (this.pendingQueries[s] = getMap[s])
            });
            Object.keys(setMap).forEach(s => {
                this.pendingCommands[s] || (this.pendingCommands[s] = setMap[s])
            });
        } finally {
            this.isFlushing = false;
            if (Object.keys(this.pendingQueries).length || Object.keys(this.pendingCommands).length) {
                this.requestFlush();
            }
        }
    };

    /**
     * simple getter for a single value
     * @param {string} getter
     * @returns {Promise<T>}
     */
    query<T>(getter: string): Promise<T>;
    /**
     * getter for any number of values. result will always be an array
     * @param {string} getter
     * @param {number} numberOfResults
     * @returns {Promise<T extends Array<any>>}
     */
    query<T extends Array<any>>(getter: string, numberOfResults: number): Promise<T>;
    query<T>(getter: string, numberOfResults?: number): Promise<T> {
        const pendingQuery = this.pendingQueries[getter];
        if (pendingQuery) {
            return pendingQuery.promise;
        } else {
            let resolver: Function = null as any;
            const resultPromise = new Promise<T>(resolve => resolver = resolve)
            // if numberOfResults is a number (even if it's 1) return an array
            const resultHandler = (typeof numberOfResults === 'number') ? resolver : (resArr: Array<T>) => resolver(resArr[0]);

            this.requestFlush();
            this.pendingQueries[getter] = new Query(numberOfResults || 1, resultHandler, getter, 'r' + (id++), resultPromise);
            return resultPromise;
        }
    }


    command(commandTemplate: string, values: Array<string>): Promise<null> {
        let existingCommand = this.pendingCommands[commandTemplate];
        if (existingCommand) {
            existingCommand.setValues(values);
            return existingCommand.promise;
        } else {
            let resolver: Function = null as any;
            const promise = new Promise<null>(resolve => resolver = resolve);
            this.pendingCommands[commandTemplate] = new Command(commandTemplate, values, resolver, promise);
            this.requestFlush();
            return promise;
        }
    }

    private requestFlush() {
        if (Object.keys(this.pendingQueries).length >= HttpDriver.maxNumberOfResults) {
            this.flush();
        } else if (!this.isFlushing) {
            setTimeout(this.flush, HttpDriver.minTimeBetweenFlushes);
            this.isFlushing = true;
        }
    }
}

