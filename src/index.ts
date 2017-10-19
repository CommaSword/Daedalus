import {run} from './fugazi/index';
import {Options, startServer} from './core/server';

export type ServerOptions = Partial<Options> & {
    resources: string
}

export function main(options: ServerOptions) {
    run(options.resources);
    startServer(options);
}
