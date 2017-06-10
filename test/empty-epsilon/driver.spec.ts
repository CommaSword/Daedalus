import {beforeAndAfter} from '../../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver} from '../../src/empty-epsilon-client/driver';
import * as config from '../config';
import {expect} from 'chai';
import {ESystem} from "../../src/empty-epsilon-client/objects/space-ship";
import {PlayerShip} from "../../src/empty-epsilon-client/objects/player-ship";

describe('HTTP Server Driver', ()=>{
    beforeAndAfter(config);
    it('gets and sets the position of a spaceship', function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        return expect(ship.getPosition()).to.eventually.eql([0,0])
            .then(() => ship.setPosition(123, 321))
            .then(()=>expect(ship.getPosition()).to.eventually.eql([123, 321]))
    });

    describe('POC scripts (regression)', ()=>{
        let ship: PlayerShip;
        before('get player ship', ()=>{
            ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        });
        describe('reads and changes the health of a spaceship\'', ()=>{
            it('hull', function () {
                let originalHull:number;
                return ship.getHull()
                    .then(hull => {
                        originalHull = hull;
                        return ship.setHull(originalHull * 2);
                    })
                    .then(()=>expect(ship.getHull()).to.eventually.equal(originalHull * 2))
                    .then(() => ship.setHull(originalHull))
                    .then(()=>expect(ship.getHull()).to.eventually.equal(originalHull))
            });
            for (let i:ESystem = 0; i < ESystem.COUNT; i++){
                it(`${ESystem[i]} health`, function () {
                    let originalHealth:number;
                    return ship.getSystemHealth(i)
                        .then(health => {
                            originalHealth = health;
                            return ship.setSystemHealth(i, originalHealth * 2);
                        })
                        .then(()=>expect(ship.getSystemHealth(i)).to.eventually.equal(originalHealth * 2))
                        .then(() => ship.setSystemHealth(i, originalHealth))
                        .then(()=>expect(ship.getSystemHealth(i)).to.eventually.equal(originalHealth))
                });
            }
        });

        it('gets and sets the hull of a spaceship', function () {
            let originalHull:number;
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
});
