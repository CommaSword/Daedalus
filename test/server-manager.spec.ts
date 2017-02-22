import {ServerManager} from '../src/server-manager'
import {HttpServerDriver} from '../src/http-server-driver';
import {ChildProcess} from "child_process";
import {expect} from 'chai';

describe('Server Manager', function () {
    let server:ChildProcess;
    before(function(){
        this.timeout(10 * 1000);
        return new ServerManager().init().then(p => server = p);
    });
    after(()=>{
        server && server.kill();
    });
    it('Starts a new server', function () {
        return expect(new HttpServerDriver().getHull()).to.eventually.equal(250);
    })
});
