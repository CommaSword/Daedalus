import {ServerDriver} from "./api";
import {default as Axios, AxiosInstance, Promise, AxiosResponse} from "axios";
import * as config from '../../config.json';

export class HttpServerDriver implements ServerDriver{
    private http: AxiosInstance;

    constructor(){
        this.http = Axios.create({baseURL: config.serverAddress});
    }

    getHull():Promise<number>{
        return this.http.request({
            method:'get',
            url: '/get.lua',
            data: {
                hull: 'getHull()'
            }
        }).then((res:AxiosResponse) => {
            if (res.data['error']){
                throw new Error('server returned error:'+res.data['error']);
            }
            return res.data.hull;
        })
    }
}
