import {AxiosInstance, AxiosResponse, default as Axios} from "axios";
import {PlayerShip} from "./objects/player-ship";
import {escape} from 'querystring';

export {ESystem} from './objects/space-ship';

/**
 * main API entry point. supplies access to game global actions and object queries
 */
export class EmptyEpsilonDriver {
    private http: HttpDriver;

    constructor(baseURL: string) {
        this.http = new HttpDriver(baseURL);
        // console.log('connecting to EE server at', baseURL)
    }

    set serverAddress(baseURL: string) {
        this.http = new HttpDriver(baseURL);
    }

    getPlayerShip(index = -1): PlayerShip {
        return new PlayerShip(new ObjectDriver(this.http, `getPlayerShip(${index})`));
    }
}

type GetRequest = {
    resolver: Function;
    getter: string;
}

/**
 * internal object for any http communication with game server
 */
export class HttpDriver {
    private static readonly minTimeBetweenFlushes = 50;
    private http: AxiosInstance;
    private pendingGetResults: { [q: string]: Promise<any> } = {};
    private getQueue: GetRequest[];
    private isFlushing = false;

    constructor(baseURL: string) {
        this.http = Axios.create({baseURL});
        this.getQueue = [];
    }

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

    async get(contextGetter: string, getter: string) {
        const query: { [k: string]: string } = {};
        query['result'] = escape(getter);
        query['_OBJECT_'] = escape(contextGetter);
        const res: AxiosResponse = await this.http.request({
            method: 'get',
            url: '/get.lua',
            params: query,
            transformResponse: JSON.parse
        });
        if (res.data['error']) {
            throw new Error('server returned error:' + res.data['error']);
        } else if (res.data['ERROR']) {
            throw new Error('server returned error:' + res.data['ERROR']);
        }
        return res.data.result;
    }

    getBuffered<T>(getter: string): Promise<T> {
        const pendingQuery = this.pendingGetResults[getter];
        if (pendingQuery) {
            return pendingQuery;
        } else {
            let resolver: Function = null as any;
            const resultPromise = this.pendingGetResults[getter] = new Promise<T>(resolve => resolver = resolve).then((result : T)=>{
                if (this.pendingGetResults[getter] === resultPromise){
                    delete this.pendingGetResults[getter];
                }
                return result;
            });
            if (!this.isFlushing && !this.getQueue.length) {
                setTimeout(this.flush, HttpDriver.minTimeBetweenFlushes);
            }
            const req: GetRequest = {resolver, getter};
            this.getQueue.push(req);
            return resultPromise;
        }
    }

    /**
     * flush all commands to the game server
     * at most, only a single flush is active at each point in time
     * at least `HttpDriver.minTimeBetweenFlushes` milliseconds will puss between the end of one flush and the beginning of the other
     * @returns {Promise<void>}
     */
    private flush = async () => {
        try {
            this.isFlushing = true;
            const buffer = this.getQueue;
            this.getQueue = [];

            const script =
                `${buffer.map(({getter}, i) => `local l${i} = ${getter}; `).join('\n')}
return {${buffer.map((_, i) => `l${i} = l${i}`).join(',')}};`;

            const res: AxiosResponse = await this.http.request({
                // timeout ?
                method: 'post',
                url: '/exec.lua',
                data: script,
                transformResponse: JSON.parse
            });
            buffer.forEach(({resolver}, i) => resolver(res.data[`l${i}`]));
        } finally {
            this.isFlushing = false;
            if (this.getQueue.length) {
                setTimeout(this.flush, HttpDriver.minTimeBetweenFlushes);
            }
        }
    };

    async set(contextGetter: string, setter: string) {
        const query: string[] = [];
        query.push(escape(setter));
        query.push('_OBJECT_=' + escape(contextGetter));
        const res: AxiosResponse = await this.http.request({
            method: 'get',
            url: '/set.lua',
            params: {q: query},
            paramsSerializer: (params) => params.q.join('&'),
            transformResponse: (d) => d ? JSON.parse(d) : {}
        });
        if (res.data['error']) {
            throw new Error('server returned error:' + res.data['error']);
        } else if (res.data['ERROR']) {
            throw new Error('server returned error:' + res.data['ERROR']);
        }
    }
}

/**
 * driver bound to the context of a single game object
 */
export class ObjectDriver {
    constructor(private httpDriver: HttpDriver, public contextQuery: string) {
    }

    async getMultiple<T extends Array<any>>(getter: string, numberOfResults: number): Promise<T> {
        return await this.httpDriver.getMultiple(this.contextQuery, getter, numberOfResults) as T;
    }

    async get<T>(getter: string): Promise<T> {
        return await this.httpDriver.get(this.contextQuery, getter);
    }

    async set(setter: string) {
        return await this.httpDriver.set(this.contextQuery, setter);
    }
}

export class Property<T> {
// TODO: mobx cache
    private readonly valueExpression: string;

    constructor(private name: string, protected driver: ObjectDriver) {
        this.valueExpression = `get${name}()`;
    }

    async get(): Promise<T> {
        return await this.driver.get<T>(this.valueExpression);
    }

    async set(value: T): Promise<void> {
        return await this.driver.set(`set${name}(${value})`);
    }
}
