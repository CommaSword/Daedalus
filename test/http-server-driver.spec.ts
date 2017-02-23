import {ServerManager} from '../src/server-manager'
import {HttpServerDriver} from '../src/http-server-driver';
import {ChildProcess} from "child_process";
import {expect} from 'chai';

describe('HTTP Server Driver', function () {
    let server:ChildProcess;
    before(()=>{
        return new ServerManager().init().then(p => server = p);
    });
    after(()=>{
        server && server.kill();
    });
    it('gets the hull of a spaceship', function () {
        return expect(new HttpServerDriver().getHull()).to.eventually.equal(250);
    })
});
