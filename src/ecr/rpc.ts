import * as  rpc from 'json-rpc2';
import * as net from "net";
import {ESystem} from "../empty-epsilon/model";
import {EcrModule} from "./index";

export type Options = {
    hostname: string;
    port?: number;
}

export function expose(module: EcrModule, options: Options): net.Server {
    const server = rpc.Server.$create();

    server.expose('beginRepair', function ([id]: [ESystem], _: any, callback: rpc.Callback<void>) {
        try {
            module.beginRepair(id);
            callback();
        } catch (e) {
            callback(e);
        }
    });
    server.expose('stopRepair', function (_args: any, _: any, callback: rpc.Callback<void>) {
        try {
            module.stopRepair();
            callback();
        } catch (e) {
            callback(e);
        }
    });

    const port = options.port || 56667;
    console.log(`providing RPC of ECR in port ${port} and host ${options.hostname}`);
    return server.listen(port, options.hostname);
}

export class EcrModuleClient {
    private readonly client: rpc.Client;
    private con: rpc.Connection;

    constructor(private options: Options) {
        const port = options.port || 56667;
        this.client = rpc.Client.$create(port, options.hostname);
        console.log(`setting up RPC of ECR in port ${this.options.port || 56667} and host ${this.options.hostname}`);
    }

    async init() {
        console.warn('using TCP for RPC! TCP does not reconnect!');
        this.con = await new Promise<rpc.Connection>((resolve, reject) =>
            this.client.connectSocket((err: Error, con: rpc.Connection) => {
                    console.log('RPC2');

                    if (err) {
                        console.log(`ERROR consuming RPC of ECR in port ${this.options.port || 56667} and host ${this.options.hostname}`, err);
                        reject(err);
                    } else {
                        resolve(con);
                    }
                }
            ));
        console.log(`consuming RPC of ECR in port ${this.options.port || 56667} and host ${this.options.hostname}`);
    }

    beginRepair(id: ESystem) {
        if (this.con) {
            return new Promise<number>((resolve, reject) =>
                this.con.call('beginRepair', [id], function (err: string, result: number) {
                    if (err) {
                        reject(new Error(err))
                    } else {
                        resolve(result);
                    }
                }));
        } else {
            return new Promise<number>((resolve, reject) =>
                this.client.call('beginRepair', [id], function (err: { code: number, message: string }, result: number) {
                    if (err) {
                        reject(new Error(err.message))
                    } else {
                        resolve(result);
                    }
                }));
            // throw new Error("EcrModuleClient not initialized but calling beginRepair()")
        }
    }

    stopRepair() {
        if (this.con) {
            return new Promise<number>((resolve, reject) =>
                this.con.call('stopRepair', [], function (err: string, result: number) {
                    err ? reject(new Error(err)) : resolve(result);
                }));
        } else {
            return new Promise<number>((resolve, reject) =>
                this.client.call('stopRepair', [], function (err: { code: number, message: string }, result: number) {
                    if (err) {
                        reject(new Error(err.message))
                    } else {
                        resolve(result);
                    }
                }));
            //throw new Error("EcrModuleClient not initialized but calling beginRepair()")
        }
    }

    end() {
        this.con && this.con.end();
    }
}
