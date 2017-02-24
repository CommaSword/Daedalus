import {ServerManager} from '../test-kit/server-manager'
import {HttpServerDriver} from '../src/http-server-driver';
import {ChildProcess} from "child_process";
import {expect} from 'chai';

describe('Managed server (e2e)', function () {
    let server:ChildProcess;
    before(()=>{
        return new ServerManager().init().then(p => server = p);
    });
    after(()=>{
        server && server.kill();
    });
    it('HTTP Server Driver gets and sets the hull of a spaceship', function () {
        let originalHull:number;
        let httpServerDriver = new HttpServerDriver();
        return httpServerDriver.getHull()
            .then(hull => {
                originalHull = hull;
                return httpServerDriver.setHull(originalHull * 2);
            })
            .then(()=>expect(httpServerDriver.getHull()).to.eventually.equal(originalHull * 2))
            .then(() => httpServerDriver.setHull(originalHull))
            .then(()=>expect(httpServerDriver.getHull()).to.eventually.equal(originalHull))
    })
});
