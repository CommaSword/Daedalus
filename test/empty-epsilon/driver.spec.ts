import {beforeAndAfter} from '../../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver} from '../../src/empty-epsilon-client/driver';
import * as config from '../config';
import {expect} from 'chai';
import {ESystem} from "../../src/empty-epsilon-client/objects/space-ship";
import {PlayerShip} from "../../src/empty-epsilon-client/objects/player-ship";

describe('HTTP Server Driver', () => {
    beforeAndAfter(config);
    it('gets and sets the position of a spaceship', function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        return expect(ship.getPosition()).to.eventually.eql([0, 0])
            .then(() => ship.setPosition(123, 321))
            .then(() => expect(ship.getPosition()).to.eventually.eql([123, 321]))
    });

    describe('POC scripts (regression)', () => {
        let ship: PlayerShip;
        before('get player ship', () => {
            ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        });
        it(`reads and changes the health of a spaceship's hull`, function () {
            let originalHull: number;
            return ship.getHull()
                .then(hull => {
                    originalHull = hull;
                    return ship.setHull(originalHull * 2);
                })
                .then(() => expect(ship.getHull()).to.eventually.equal(originalHull * 2))
                .then(() => ship.setHull(originalHull))
                .then(() => expect(ship.getHull()).to.eventually.equal(originalHull))
        });
        for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
            it(`reads and changes health of a spaceship's ${ESystem[system]} system`, function () {
                let originalHealth: number;
                return ship.getSystemHealth(system)
                    .then(health => {
                        originalHealth = health;
                        return ship.setSystemHealth(system, originalHealth * 2);
                    })
                    .then(() => expect(ship.getSystemHealth(system)).to.eventually.equal(originalHealth * 2))
                    .then(() => ship.setSystemHealth(system, originalHealth))
                    .then(() => expect(ship.getSystemHealth(system)).to.eventually.equal(originalHealth))
            });
            it(`reads and changes heat of a spaceship's ${ESystem[system]} system`, function () {
                let originalHeat: number;
                return ship.getSystemHeat(system)
                    .then(health => {
                        originalHeat = health;
                        return ship.setSystemHeat(system, originalHeat * 2);
                    })
                    .then(() => expect(ship.getSystemHeat(system)).to.eventually.equal(originalHeat * 2))
                    .then(() => ship.setSystemHeat(system, originalHeat))
                    .then(() => expect(ship.getSystemHeat(system)).to.eventually.equal(originalHeat))
            });
        }
    });
});
