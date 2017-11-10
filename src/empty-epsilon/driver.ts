import {AxiosInstance, AxiosResponse, default as Axios} from "axios";

type GetRequest = {
    resolver: Function;
    getter: string;
}

type SetToAbsolute = {
    setter: string;
    value: string;
    resolver: Function;
    promise: Promise<any>;
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
    /**
     * flush all commands to the game server
     * at most, only a single flush is active at each point in time
     * at least `HttpDriver.minTimeBetweenFlushes` milliseconds will puss between the end of one flush and the beginning of the other
     * @returns {Promise<void>}
     */
    private flush = async () => {
        const buffer = this.getQueue;
        const setBuffer = this.setMap;
        this.getQueue = [];
        this.setMap = {};
        try {
            const script =
                `${Object.keys(setBuffer).map((s: string) => `${setBuffer[s].setter}(${setBuffer[s].value})`).join('\n')}
${buffer.map(({getter}, i) => `local l${i} = ${getter}; `).join('\n')}
return {${buffer.map((_, i) => `l${i} = l${i}`).join(',')}};`;

            const res: AxiosResponse = await this.http.request({
                // timeout ?
                method: 'post',
                url: '/exec.lua',
                data: script,
                transformResponse: JSON.parse
            });
            buffer.forEach(({resolver}, i) => resolver(res.data[`l${i}`]));
            Object.keys(setBuffer).forEach(s => setBuffer[s].resolver(null));
        } catch (e) {
            this.getQueue.push(...buffer);
            Object.keys(setBuffer).forEach(s => {
                this.setMap[s] || (this.setMap[s] = setBuffer[s])
            });
        } finally {
            this.isFlushing = false;
            if (this.getQueue.length || Object.keys(this.setMap).length) {
                this.requestFlush();
            }
        }
    };

    constructor(baseURL: string) {
        this.http = Axios.create({baseURL});
    }

    /**
     * legacy code (still working) for getting multiple values from a function
     */
    async getMultiple(contextGetter: string, getter: string, numberOfResults: number) {
        const locals: string[] = [];
        while (numberOfResults--) {
            locals.push('l' + numberOfResults);
        }
        const query = `local ${locals.join(',')} = ${contextGetter}:${getter}; return {${locals.map(e => e + '=' + e).join(',')}}`;
        const res: AxiosResponse = await this.http.request({
            method: 'post',
            url: '/exec.lua',
            data: query,
            transformResponse: JSON.parse
        });
        if (res.data['error']) {
            throw new Error('server returned error:' + res.data['error']);
        } else if (res.data['ERROR']) {
            throw new Error('server returned error:' + res.data['ERROR']);
        }
        return locals.map(e => res.data[e]);
    }

    getBuffered<T>(getter: string): Promise<T> {
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
            this.requestFlush();
            const req: GetRequest = {resolver, getter};
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

