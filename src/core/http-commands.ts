import {createServer} from "http";
import {parse, UrlWithStringQuery} from "url";
import {Observable, Subject} from "rxjs";

export type Options = {
    port: number;
}

export type HttpMessage = {url: UrlWithStringQuery, accept: (res:string)=>void};
export type HttpCommandsDriver = {observable: Observable<HttpMessage>, destroy: ()=>void}
export function createHttpCommandsDriver(options: Options): HttpCommandsDriver
{
    var subject = new Subject<HttpMessage>();
    var observable = subject.asObservable();
    const server = createServer((req, res) => {
        let result: string | null = null;
        subject.next({ url: parse(req.url), accept: (resStr:string)=> result = resStr });
        if (result == null ){
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end();
        } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(result);
        }
    });
    console.log(`providing HTTP endpoints in port ${options.port}`);
    server.listen(options.port);
    return {observable, destroy: ()=> {
        server.close();
        subject.complete();
    }};
};