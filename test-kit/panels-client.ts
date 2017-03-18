import * as Promise from 'bluebird';
import {Socket} from 'net';

export class FakePanel {
    private client = new Socket();

    connect(port: number):Promise<void>{
        const result = Promise.defer<void>();
        this.client.connect(port, '127.0.0.1', () =>{
            console.log('fake panel connected');
            result.resolve();
        });
        return result.promise;
    }
    close(){
        const result = Promise.defer<void>();
        if (this.client.destroyed){
            result.resolve();
        } else {
            this.client.once('close', () => {
                result.resolve()
            });
            this.client.end();
            setTimeout(() => {
                if (!this.client.destroyed) {
                    this.client.destroy();
                }
            }, 1000);
        }
        return result.promise;
    }
    write(data:Object):Promise<void>{
        const result = Promise.defer<void>();
        this.client.write(JSON.stringify(data), () =>{
            result.resolve();
        });
        return result.promise;
    }
    onData(handler:(data:any)=>void){
        this.client.on('data', handler);
    }
    onClose(handler:()=>void){
        this.client.on('close', handler);
    }
}
