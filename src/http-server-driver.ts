import {ServerDriver} from "./api";
import {default as Axios, AxiosInstance, Promise, AxiosResponse} from "axios";
import {PlayerShip} from "./player-ship";
export {Promise}  from "axios";

export class HttpDriver {
    private http: AxiosInstance;

    constructor(baseURL: string){
        this.http = Axios.create({baseURL});
    }

    get(getter: string, contextGetter:string) {
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
            }
            return res.data.result;
        });
    }
    set(setter: string, contextGetter:string) {
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
            }
        });
    }
}

export class HttpServerDriver implements ServerDriver{
    private http:HttpDriver;
    constructor(baseURL: string){
        this.http = new HttpDriver(baseURL);
    }

    set serverAddress(baseURL:string){
        this.http = new HttpDriver(baseURL);
    }

    getPlayerShip(index = -1){
        return new PlayerShip(this.http, index);
    }
}
