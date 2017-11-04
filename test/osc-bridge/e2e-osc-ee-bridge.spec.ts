import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {ESystem} from "../../src/empty-epsilon/objects/space-ship";
import {Subject} from "rxjs";
import {monitorByAddress} from "../../src/osc-bridge/game-monitor";
import {Observable} from "rxjs/Observable";
import {MetaArgument, OscMessage} from "osc";
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

    function pollDriver(address: string): Promise<OscMessage> {
        //setTimeout( () => , 0);
        const result = next(output);
        pollRequests.next(address);
        return result;
    }

    async function expectPoll(address: string, expected: Array<MetaArgument>) {
        const msgPromise = next(output);
        pollRequests.next(address);
        const oscMsg = await msgPromise;
        expect(oscMsg).to.have.property('address', address);
        expect(oscMsg.args).to.have.length(expected.length);
        const args: Array<MetaArgument> = oscMsg.args as any;
        expected.forEach((e, i) => {
            if (typeof e.value === 'number') {
                expect(args[i]).to.have.property('type', e.type);
                expect(args[i].value).to.be.approximately(e.value, e.value * .05);
            } else {
                expect(args[i]).to.eql(e);
            }
        });
    }

    before(() => {
        output = monitorByAddress(pollRequests, httpDriver);
        output.subscribe(() => null, console.error.bind(console), console.log.bind(console, 'completed'));
    });

    it('gets and sets the hull of a spaceship', async function () {
        await expectPoll('/ee/player-ship/-1/hull', [{type: 'f', value: 250}]);
        await httpDriver.setToValueBuffered('getPlayerShip(-1):setHull', '123');
        //   pollRequests.next('/ee/player-ship/-1/hull');
        await expectPoll('/ee/player-ship/-1/hull', [{type: 'f', value: 123}]);
        await httpDriver.setToValueBuffered('getPlayerShip(-1):setHull', '250');

    });

    xit('gets and sets the position of a spaceship', async function () {
        expect(await pollDriver('/ee/player-ship/-1/position')).to.eql({
            address: '/ee/player-ship/-1/position',
            //type: 'ii',
            args: [0, 0]
        });
        await httpDriver.setToValueBuffered('getPlayerShip(-1):setPosition', [123, 321].join(','));
        expect(await pollDriver('/ee/player-ship/-1/position')).to.eql({
            address: '/ee/player-ship/-1/position',
            // type: 'ii',
            args: [123, 321]
        });
    });

    for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
        it(`read health of a spaceship's ${ESystem[system]} system`, async function () {
            await expectPoll(`/ee/player-ship/-1/system-health/"${ESystem[system]}"`, [{type: 'f', value: 1}]);
        });
        it(`change health of a spaceship's ${ESystem[system]} system`, async function () {
            await httpDriver.setToValueBuffered('getPlayerShip(-1):setSystemHealth', `"${ESystem[system]}", 0.5`);
            await expectPoll(`/ee/player-ship/-1/system-health/"${ESystem[system]}"`, [{type: 'f', value: 0.5}]);
            await httpDriver.setToValueBuffered('getPlayerShip(-1):setSystemHealth', `"${ESystem[system]}", 1`);
        });
        it(`read heat of a spaceship's ${ESystem[system]} system`, async function () {
            await expectPoll(`/ee/player-ship/-1/system-heat/"${ESystem[system]}"`, [{type: 'f', value: 0}]);
        });
        it(`change heat of a spaceship's ${ESystem[system]} system`, async function () {
            await httpDriver.setToValueBuffered('getPlayerShip(-1):setSystemHeat', `"${ESystem[system]}", 0.5`);
            await expectPoll(`/ee/player-ship/-1/system-heat/"${ESystem[system]}"`, [{type: 'f', value: 0.5}]);
            await httpDriver.setToValueBuffered('getPlayerShip(-1):setSystemHeat', `"${ESystem[system]}", 0`);
        });
    }
});
