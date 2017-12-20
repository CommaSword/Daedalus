// import './global';
import * as http from "http";
import * as net from "net";

declare module "json-rpc2" {
    export interface Callback<T> { (err?: any, result?: T): void }

    export class Server {
        static $create(options?: {
            websocket?: boolean; // is true by default
            headers?: any;
        }): Server;

        on(event: 'error', listener: (err: any) => void): void;

        enableAuth(auth: (user: string, password: string) => boolean): void;

        expose(name: string, procedure: Function): void;
        expose(name: string, namespace: object): void;

        listen(port: number, host: string): http.Server;

        listenRaw(port: number, host: string): net.Server;
    }

    export interface Connection {
        call<T>(name: string, args: Array<any>, cb: Callback<T>): void;

        end(): void;
    }

    export class Client {
        static $create(port: number, host: string): Client;


        connectSocket(cb: Callback<Connection>): void;

        connectWebsocket(cb: Callback<Connection>): void;

        //http
        call<T>(name: string, args: Array<any>, cb: Callback<T>): void;
    }
}
