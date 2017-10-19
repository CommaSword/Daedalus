import {Socket} from 'net';

export class Terminal {
    private client = new Socket();

    connect(port: number): Promise<void> {
        return new Promise((resolve) =>
            this.client.connect(port, '127.0.0.1', () => {
                console.log('fake terminal connected');
                resolve();
            }));
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.client.destroyed) {
                resolve();
            } else {
                this.client.once('close', () => {
                    resolve()
                });
                this.client.end();
                setTimeout(() => {
                    if (!this.client.destroyed) {
                        this.client.destroy();
                    }
                }, 1000);
            }
        });
    }

    write(data: Object): Promise<void> {
        return new Promise((resolve) =>
            this.client.write(JSON.stringify(data), () => {
                resolve();
            }));
    }

    onData(handler: (data: any) => void) {
        this.client.on('data', handler);
    }

    onClose(handler: () => void) {
        this.client.on('close', handler);
    }
}
