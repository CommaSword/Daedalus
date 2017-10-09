import {beforeAndAfter} from '../../../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver} from '../../../src/core/empty-epsilon/driver';
import * as config from '../../config';
import {expect} from 'chai';
import {ESystem} from "../../../src/core/empty-epsilon/objects/space-ship";
import {PlayerShip} from "../../../src/core/empty-epsilon/objects/player-ship";

describe('HTTP Server Driver', () => {
    beforeAndAfter(config);
    it('gets and sets the position of a spaceship', async function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        await expect(ship.getPosition()).to.eventually.eql([0, 0]);
        await ship.setPosition(123, 321);
        await expect(ship.getPosition()).to.eventually.eql([123, 321]);
    });

    describe('POC scripts (regression)', () => {
        let ship: PlayerShip;
        before('get player ship', () => {
            ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        });
        it(`reads and changes the health of a spaceship's hull`, async function () {
            const originalHull = await ship.getHull();
            await ship.setHull(originalHull * 2);
            await expect(ship.getHull()).to.eventually.equal(originalHull * 2)
            await ship.setHull(originalHull)
            await expect(ship.getHull()).to.eventually.equal(originalHull)
        });
        for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
            it(`reads and changes health of a spaceship's ${ESystem[system]} system`, async function () {
                const originalHealth = await  ship.getSystemHealth(system);
                await ship.setSystemHealth(system, originalHealth * 2);
                await expect(ship.getSystemHealth(system)).to.eventually.equal(originalHealth * 2);
                await ship.setSystemHealth(system, originalHealth);
                await expect(ship.getSystemHealth(system)).to.eventually.equal(originalHealth);
            });
            it(`reads and changes heat of a spaceship's ${ESystem[system]} system`, async function () {
                const originalHeat = await ship.getSystemHeat(system);
                await ship.setSystemHeat(system, originalHeat * 2);
                await expect(ship.getSystemHeat(system)).to.eventually.equal(originalHeat * 2);
                await ship.setSystemHeat(system, originalHeat);
                await expect(ship.getSystemHeat(system)).to.eventually.equal(originalHeat);
            });
        }
    });
});
