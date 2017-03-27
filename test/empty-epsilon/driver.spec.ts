import {beforeAndAfter} from '../../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver} from '../../src/empty-epsilon-client/driver';
import * as config from '../config';
import {expect} from 'chai';

describe('HTTP Server Driver', ()=>{
    beforeAndAfter(config);
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
