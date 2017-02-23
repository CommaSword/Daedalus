import {ServerDriver} from "./api";
import {default as Axios, AxiosInstance, Promise, AxiosResponse} from "axios";
import * as config from '../../config.json';

export class HttpServerDriver implements ServerDriver{
    private http: AxiosInstance;

    constructor(){
        this.http = Axios.create({baseURL: config.serverAddress});
    }

    getHull():Promise<number>{
        return this.get({hull: 'getHull()'}).then(data => data.hull);
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
}
