import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver, HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {ESystem} from "../../src/empty-epsilon/objects/space-ship";
import {PlayerShip} from "../../src/empty-epsilon/objects/player-ship";
import {Subject} from "rxjs";
import {monitorByAddress} from "../../src/osc-bridge/game-monitor";
import {Observable} from "rxjs/Observable";
import {OscMessage} from "osc";
import {Subscription} from "rxjs/Subscription";


function next<T>(o: Observable<T>): Promise<T> {
    let subscription: Subscription;
    const result = new Promise<T>((resolve, reject) => {
        let value: any;
        subscription = o.subscribe((x: T) => resolve(x), (err: any) => reject(err), () => resolve(undefined));
    });
    //  result.then(() => subscription.unsubscribe(), () => subscription.unsubscribe());
    return result;
}



describe('monitorByAddress e2e', () => {
    beforeAndAfter(config);
    let httpDriver = new HttpDriver(config.serverAddress);
    const pollRequests = new Subject<string>();
    let output: Observable<OscMessage>;

    function pollDriver(address : string ): Promise<OscMessage> {
        //setTimeout( () => , 0);
        const result = next(output);
        pollRequests.next(address);
        return result;
    }
    before(() => {
        output = monitorByAddress(pollRequests, httpDriver);
        output.subscribe(() => null, console.error.bind(console), console.log.bind(console, 'completed'));
    });

    it('gets and sets the hull of a spaceship', async function () {
        expect(await pollDriver('/ee/player-ship/-1/hull')).to.eql({
            address: '/ee/player-ship/-1/hull',
            args: [{type: 'f', value: 250}]
        });
        await httpDriver.setToValueBuffered('getPlayerShip(-1):setHull', '123');
        pollRequests.next('/ee/player-ship/-1/hull');

        expect(await pollDriver('/ee/player-ship/-1/hull')).to.eql({
            address: '/ee/player-ship/-1/hull',
            args: [{type: 'f', value: 123}]
        });
    });

    it('gets and sets the position of a spaceship', async function () {
        expect(await pollDriver('/ee/player-ship/-1/position')).to.eql({
            address: '/ee/player-ship/-1/position',
            type: 'ii',
            args: [0, 0]
        });
        await httpDriver.setToValueBuffered('getPlayerShip(-1):setPosition', [123, 321].join(','));
        expect(await pollDriver('/ee/player-ship/-1/position')).to.eql({
            address: '/ee/player-ship/-1/position',
            type: 'ii',
            args: [123, 321]
        });
    });

    xdescribe('POC scripts (regression)', () => {
        let ship: PlayerShip;
        before('get player ship', () => {
            ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        });
        it(`reads and changes the health of a spaceship's hull`, async function () {
            const originalHull = await ship.getHull();
            await ship.setHull(originalHull * 2);
            expect(await ship.getHull()).to.equal(originalHull * 2)
            await ship.setHull(originalHull)
            expect(await ship.getHull()).to.equal(originalHull)
        });
        for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
            it(`reads and changes health of a spaceship's ${ESystem[system]} system`, async function () {
                const originalHealth = await  ship.getSystemHealth(system);
                await ship.setSystemHealth(system, originalHealth * 2);
                expect(await ship.getSystemHealth(system)).to.equal(originalHealth * 2);
                await ship.setSystemHealth(system, originalHealth);
                expect(await ship.getSystemHealth(system)).to.equal(originalHealth);
            });
            it(`reads and changes heat of a spaceship's ${ESystem[system]} system`, async function () {
                const originalHeat = await ship.getSystemHeat(system);
                await ship.setSystemHeat(system, originalHeat * 2);
                expect(await ship.getSystemHeat(system)).to.equal(originalHeat * 2);
                await ship.setSystemHeat(system, originalHeat);
                expect(await ship.getSystemHeat(system)).to.equal(originalHeat);
            });
        }
    });
});
