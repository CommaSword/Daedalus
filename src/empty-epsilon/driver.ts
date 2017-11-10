import {AxiosInstance, AxiosResponse, default as Axios} from "axios";

type SetToAbsolute = {
    setter: string;
    value: string;
    resolver: Function;
    promise: Promise<any>;
}

class GetRequest {
    public symbols: string[];

    constructor(private numberOfResults: number,
                public resolver: Function,
                public getter: string,
                uniqueId: string) {
        this.symbols = this.numberOfResults > 1 ? Array.from(Array(this.numberOfResults)).map((_, i) => uniqueId + '_' + i) : [uniqueId];
    }
}

/**
 * internal object for any http communication with game server
 */
export class HttpDriver {
    private static readonly minTimeBetweenFlushes = 50;
    private http: AxiosInstance;
    private pendingGetResults: { [q: string]: Promise<any> } = {};
    private getQueue: GetRequest[] = [];
    private setMap: { [setter: string]: SetToAbsolute } = {};
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
        const getQueue = this.getQueue;
        const setMap = this.setMap;
        this.getQueue = [];
        this.setMap = {};
        try {
            const script =
                `${Object.keys(setMap).map((s: string) => `${setMap[s].setter}(${setMap[s].value})`).join('\n')}
${getQueue.map((req, i) => {
                    return `local ${req.symbols.join(',')} = ${req.getter}; `;
                }).join('\n')}
return {${getQueue.map((req, i) => req.symbols.map(s => `${s} = ${s}`).join(',')).join(',')}};`;

            const res: AxiosResponse = await this.http.request({
                // timeout ?
                method: 'post',
                url: '/exec.lua',
                data: script,
                transformResponse: JSON.parse
            });
            getQueue.forEach((req, i) => req.resolver(req.symbols.map(s => res.data[s])));
            Object.keys(setMap).forEach(s => setMap[s].resolver(null));
        } catch (e) {
            this.getQueue.push(...getQueue);
            Object.keys(setMap).forEach(s => {
                this.setMap[s] || (this.setMap[s] = setMap[s])
            });
        } finally {
            this.isFlushing = false;
            if (this.getQueue.length || Object.keys(this.setMap).length) {
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
        const pendingQuery = this.pendingGetResults[getter];
        if (pendingQuery) {
            return pendingQuery;
        } else {
            let resolver: Function = null as any;
            const resultPromise = this.pendingGetResults[getter] = new Promise<T>(resolve => resolver = resolve)
                .then((result: T) => {
                    if (this.pendingGetResults[getter] === resultPromise) {
                        delete this.pendingGetResults[getter];
                    }
                    return result;
                });
            // if numberOfResults is a number (even if it's 1) return an array
            const resultHandler = (typeof numberOfResults === 'number') ? resolver : (resArr: Array<T>) => resolver(resArr[0]);

            this.requestFlush();
            const req: GetRequest = new GetRequest(numberOfResults || 1, resultHandler, getter, 'r' + this.getQueue.length);
            this.getQueue.push(req);
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
            this.setMap[setter] = {setter, value, resolver, promise};
            this.requestFlush();
            return promise;
        }
    }

    private requestFlush() {
        if (!this.isFlushing) {
            setTimeout(this.flush, HttpDriver.minTimeBetweenFlushes);
            this.isFlushing = true;
        }
    }
}

