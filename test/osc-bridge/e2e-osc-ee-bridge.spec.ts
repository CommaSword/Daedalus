import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {Subject} from "rxjs";
import {executeDriverCommands, monitorByAddress} from "../../src/osc-bridge/game-monitor";
import {Observable} from "rxjs/Observable";
import {MetaArgument, OscMessage} from "osc";
import {Subscription} from "rxjs/Subscription";
import {ESystem} from "../../src/empty-epsilon/model";


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
    const pushRequests = new Subject<OscMessage>();
    let pollResults: Observable<OscMessage>;

    function pollDriver(address: string): Promise<OscMessage> {
        //setTimeout( () => , 0);
        const result = next(pollResults);
        pollRequests.next(address);
        return result;
    }

    async function expectPoll(address: string, expected: Array<MetaArgument>) {
        const msgPromise = next(pollResults);
        pollRequests.next(address);
        const oscMsg = await msgPromise;
        expect(oscMsg).to.have.property('address', address);
        expect(oscMsg.args).to.have.length(expected.length);
        const args: Array<MetaArgument> = oscMsg.args as any;
        expected.forEach((e, i) => {
            if (typeof e.value === 'number') {
                expect(args[i]).to.have.property('type', e.type);
                expect(args[i].value, 'value of '+address).to.be.approximately(e.value, e.value * .05);
            } else {
                expect(args[i]).to.eql(e);
            }
        });
    }

    before('wire push/ poll requests to driver', () => {
        executeDriverCommands(pushRequests, httpDriver);
        pollResults = monitorByAddress(pollRequests, httpDriver);
        pollResults.subscribe(() => null, console.error.bind(console), console.log.bind(console, 'completed'));
    });

    it('gets and sets the hull of a spaceship', async function () {
        await expectPoll('/ee/player-ship/-1/hull', [{type: 'f', value: 250}]);
        pushRequests.next({address : '/ee/player-ship/-1/hull', args: [{type: 'f', value: 123}]});
        await expectPoll('/ee/player-ship/-1/hull', [{type: 'f', value: 123}]);
    });

    it('gets and sets the position of a spaceship', async function () {
        expect(await pollDriver('/ee/player-ship/-1/position')).to.eql({
            address: '/ee/player-ship/-1/position',
            //type: 'ii',
            args: [{type: 'f', value: 0}, {type: 'f', value: 0}]
        });
        pushRequests.next({address : '/ee/player-ship/-1/position', args: [{type: 'f', value: 123}, {type: 'f', value: 321}]});
        expect(await pollDriver('/ee/player-ship/-1/position')).to.eql({
            address: '/ee/player-ship/-1/position',
            // type: 'ii',
            args: [{type: 'f', value: 123}, {type: 'f', value: 321}]
        });
    });

    for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
        it(`get and set health of a spaceship's ${ESystem[system]} system`, async function () {
            const address = `/ee/player-ship/-1/system-health/${ESystem[system]}`;
            await expectPoll(address, [{type: 'f', value: 1}]);
            pushRequests.next({address: address, args: [{type: 'f', value: 0.5}]});
            await expectPoll(address, [{type: 'f', value: 0.5}]);
        });
        it(`get and set heat of a spaceship's ${ESystem[system]} system`, async function () {
            const address = `/ee/player-ship/-1/system-heat/${ESystem[system]}`;
            await expectPoll(address, [{type: 'f', value: 0}]);
            pushRequests.next({address: address, args: [{type: 'f', value: 0.5}]});
            await expectPoll(address, [{type: 'f', value: 0.5}]);
        });
        it(`get and set power of a spaceship's ${ESystem[system]} system`, async function () {
            const address = `/ee/player-ship/-1/system-power/${ESystem[system]}`;
            await expectPoll(address, [{type: 'f', value: 1}]);
            pushRequests.next({address: address, args: [{type: 'f', value: 0.5}]});
            await expectPoll(address, [{type: 'f', value: 0.5}]);
        });
        it(`get and set coolant of a spaceship's ${ESystem[system]} system`, async function () {
            const address = `/ee/player-ship/-1/system-coolant/${ESystem[system]}`;
            await expectPoll(address, [{type: 'f', value: 0}]);
            pushRequests.next({address: address, args: [{type: 'f', value: 0.5}]});
            await expectPoll(address, [{type: 'f', value: 0.5}]);
        });
    }
    it(`get and set health of all spaceship's systems (stress)`, async function () {
        let system: ESystem = ESystem.Reactor;

        for (let system: ESystem = 0; system < ESystem.MissileSystem; system++) {
            const address = `/ee/player-ship/-1/system-health/${ESystem[system]}`;
         //   pollRequests.next(address);
            pushRequests.next({address: address, args: [{type: 'f', value: 0.5}]});
        }
        // a dirty way to wait for driver flush
       // await  pushRequests.next({address : '/ee/player-ship/-1/hull', args: [{type: 'f', value: 123}]});

     //   for (let system: ESystem = 0; system < ESystem.COUNT; system++) {
           const address = `/ee/player-ship/-1/system-health/${ESystem[system]}`;
            await expectPoll(address, [{type: 'f', value: 0.5}]);
       // }
    });
});
