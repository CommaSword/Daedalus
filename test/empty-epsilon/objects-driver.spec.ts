import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {ESystem} from "../../src/empty-epsilon/objects/space-ship";
import {PlayerShip} from "../../src/empty-epsilon/objects/player-ship";

describe('EE objects Driver', () => {
    beforeAndAfter(config);
    it('gets and sets the position of a spaceship', async function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
      //  expect(await ship.getPosition()).to.eql([0, 0]);
        await ship.setPosition(123, 321);
        expect(await ship.getPosition()).to.eql([123, 321]);
    });

    describe('POC scripts (regression)', () => {
        let ship: PlayerShip;
        before('get player ship', () => {
            ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        });
        it(`reads and changes the health of a spaceship's hull`, async function () {
            const originalHull = await ship.getHull();
            await ship.setHull(originalHull * 2);
            expect(await ship.getHull()).to.equal(originalHull * 2);
            await ship.setHull(originalHull);
            expect(await ship.getHull()).to.equal(originalHull)
        });
        for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
            it(`reads and changes health of a spaceship's ${ESystem[system]} system`, async function () {
                const originalHealth = await  ship.getSystemHealth(system);
                await ship.setSystemHealth(system,  0.5);
                expect(await ship.getSystemHealth(system)).to.equal( 0.5);
                await ship.setSystemHealth(system, originalHealth);
                expect(await ship.getSystemHealth(system)).to.equal(originalHealth);
            });
            it(`reads and changes heat of a spaceship's ${ESystem[system]} system`, async function () {
                const originalHeat = await ship.getSystemHeat(system);
                await ship.setSystemHeat(system, 0.5);
                expect(await ship.getSystemHeat(system)).to.equal(0.5);
                await ship.setSystemHeat(system, originalHeat);
                expect(await ship.getSystemHeat(system)).to.equal(originalHeat);
            });
        }
    });
});
