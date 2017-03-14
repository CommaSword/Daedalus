import {ServerManager} from '../../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver} from '../../src/empty-epsilon/driver';
import {ChildProcess} from "child_process";
import {expect} from 'chai';
import * as config from '../../../config.json';

describe('HTTP Server Driver', ()=>{
    let server:ChildProcess;
    before('init managed server', ()=>{
        return new ServerManager().init().then(p => server = p);
    });
    after('destroy managed server', ()=>{
        server && server.kill();
    });
    it('gets and sets the position of a spaceship', function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        return expect(ship.getPosition()).to.eventually.eql([0,0])
            .then(() => ship.setPosition(123, 321))
            .then(()=>expect(ship.getPosition()).to.eventually.eql([123, 321]))
    });

    it('gets and sets the hull of a spaceship', function () {
        let originalHull:number;
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
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
