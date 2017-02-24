import {ServerDriver} from "./api";
import {default as Axios, AxiosInstance, Promise, AxiosResponse} from "axios";
import * as config from '../../config.json';

export class HttpServerDriver implements ServerDriver{
    private http: AxiosInstance;

    constructor(){
        this.http = Axios.create({baseURL: config.serverAddress});
    }

    set serverAddress(baseURL:string){
        this.http = Axios.create({baseURL});
    }

    getHull():Promise<number>{
        return this.get({hull: `getHull()`}).then(data => data.hull);
    }

    setHull(number: number):Promise<void> {
        return this.set(`setHull(${number})`);
    }

    private get(query: {}) {
        return this.http.request({
            method: 'get',
            url: '/get.lua',
            params: query,
            transformResponse: JSON.parse
        }).then((res: AxiosResponse) => {
            if (res.data['error']) {
                throw new Error('server returned error:' + res.data['error']);
            }
            return res.data;
        });
    }
    private set(query: string) {
        return this.http.request({
            method: 'get',
            url: '/set.lua',
            params: {q:query},
            paramsSerializer:(params)=>params.q,
            transformResponse: (d)=>d? JSON.parse(d):{}
        }).then((res: AxiosResponse) => {
            if (res.data['error']) {
                throw new Error('server returned error:' + res.data['error']);
            }
        });
    }
}
