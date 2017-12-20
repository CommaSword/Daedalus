import * as  rpc from 'json-rpc2';
import * as net from "net";
import {ESystem} from "../empty-epsilon/model";
import {EcrModule} from "./index";

export function expose(module: EcrModule): net.Server {
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

    // TODO: configurable
    return server.listenRaw(56667, 'localhost');
}

export class EcrModuleClient {
    private readonly client: rpc.Client;
    private con: rpc.Connection;

    constructor() {
        this.client = rpc.Client.$create(56667, 'localhost');
    }

    async init() {
        this.con = await new Promise<rpc.Connection>((resolve, reject) =>
            this.client.connectSocket((err: Error, con: rpc.Connection) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(con);
                    }
                }
            ));
    }

    beginRepair(id: ESystem) {
        return new Promise<number>((resolve, reject) =>
            this.con.call('beginRepair', [id], function (err: string, result: number) {
                err ? reject(new Error(err)) : resolve(result);
            }));
    }

    stopRepair() {
        return new Promise<number>((resolve, reject) =>
            this.con.call('stopRepair', [], function (err: string, result: number) {
                err ? reject(new Error(err)) : resolve(result);
            }));
    }

    end() {
        this.con.end();
    }
}

// Call add function on the server

