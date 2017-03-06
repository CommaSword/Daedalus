import {ServerManager} from '../test-kit/server-manager'
import {HttpServerDriver} from '../src/http-server-driver';
import {ChildProcess} from "child_process";
import {expect} from 'chai';
import * as config from '../../config.json';

describe('Managed server (e2e)', function () {
    let server:ChildProcess;
    before(()=>{
        return new ServerManager().init().then(p => server = p);
    });
    after(()=>{
        server && server.kill();
    });
    it('HTTP Server Driver gets and sets the position of a spaceship', function () {
        let originalHull:number;
        let ship = new HttpServerDriver(config.serverAddress).getPlayerShip();
        return expect(ship.getPosition()).to.eventually.eql([0,0])
            .then(() => ship.setPosition(123, 321))
            .then(()=>expect(ship.getPosition()).to.eventually.eql([123, 321]))
    });

    it('HTTP Server Driver gets and sets the hull of a spaceship', function () {
        let originalHull:number;
        let ship = new HttpServerDriver(config.serverAddress).getPlayerShip();
        return ship.getHull()
            .then(hull => {
                originalHull = hull;
                return ship.setHull(originalHull * 2);
            })
            .then(()=>expect(ship.getHull()).to.eventually.equal(originalHull * 2))
            .then(() => ship.setHull(originalHull))
            .then(()=>expect(ship.getHull()).to.eventually.equal(originalHull))
    });
});
