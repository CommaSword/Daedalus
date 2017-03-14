import {ServerDriver} from "./api";
import {default as Axios, AxiosInstance, Promise, AxiosResponse} from "axios";
import {PlayerShip} from "./objects/player-ship";
export {Promise}  from "axios";


/**
 * main API entry point. supplies access to game global actions and object queries
 */
export class EmptyEpsilonDriver implements ServerDriver{
    private http:HttpDriver;
    constructor(baseURL: string){
        this.http = new HttpDriver(baseURL);
    }

    set serverAddress(baseURL:string){
        this.http = new HttpDriver(baseURL);
    }

    getPlayerShip(index = -1){
        return new PlayerShip(new ObjectDriver(this.http, `getPlayerShip(${index})`));
    }
}

/**
 * internal object for any http communication with game server
 */
export class HttpDriver {
    private http: AxiosInstance;

    constructor(baseURL: string){
        this.http = Axios.create({baseURL});
    }

    getMultiple(contextGetter:string, getter: string, numberOfResults:number) {
        const locals:string[] = [];
        while (numberOfResults--){
            locals.push('l'+numberOfResults);
        }
        const query = `local ${locals.join(',')} = ${contextGetter}:${getter}; return {${locals.map(e => e+'='+e).join(',')}}`;
        return this.http.request({
            method: 'post',
            url: '/exec.lua',
            data: query,
            transformResponse: JSON.parse
        }).then((res: AxiosResponse) => {
            if (res.data['error']) {
                throw new Error('server returned error:' + res.data['error']);
            } else  if (res.data['ERROR']) {
                throw new Error('server returned error:' + res.data['ERROR']);
            }
            return locals.map(e=>res.data[e]);
        });
    }

    get(contextGetter:string, getter: string) {
        const query:{[k:string]:string} = {};
        query['result'] = getter;
        query['_OBJECT_'] = contextGetter;
        return this.http.request({
            method: 'get',
            url: '/get.lua',
            params: query,
            transformResponse: JSON.parse
        }).then((res: AxiosResponse) => {
            if (res.data['error']) {
                throw new Error('server returned error:' + res.data['error']);
            } else  if (res.data['ERROR']) {
                throw new Error('server returned error:' + res.data['ERROR']);
            }
            return res.data.result;
        });
    }
    set(contextGetter:string, setter: string) {
        const query:string[] = [];
        query.push(setter);
        query.push('_OBJECT_='+contextGetter);
        return this.http.request({
            method: 'get',
            url: '/set.lua',
            params: {q:query},
            paramsSerializer:(params)=>params.q.join('&'),
            transformResponse: (d)=>d? JSON.parse(d):{}
        }).then((res: AxiosResponse) => {
            if (res.data['error']) {
                throw new Error('server returned error:' + res.data['error']);
            } else  if (res.data['ERROR']) {
                throw new Error('server returned error:' + res.data['ERROR']);
            }
        });
    }
}

/**
 * driver bound to the context of a single game object
 */
export class ObjectDriver{
    constructor(private httpDriver:HttpDriver, public contextQuery:string){}
    getMultiple<T>(getter: string, numberOfResults:number):Promise<Array<T>> {
        return this.httpDriver.getMultiple(this.contextQuery, getter, numberOfResults);
    }
    get<T>(getter: string):Promise<T> {
        return this.httpDriver.get(this.contextQuery, getter);
    }
    set(setter: string) {
        return this.httpDriver.set(this.contextQuery, setter);
    }
}
