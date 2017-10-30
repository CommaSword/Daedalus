import {monitorByAddress} from "../../src/core/game-monitor";
import {Subject} from "rxjs/Subject";
import {spy, stub} from "sinon";
import {expect} from "chai";

function delay(timeout: number) {
    return new Promise(r => setTimeout(r, timeout));
}

describe('monitorByAddress', () => {
    it('basically works', async () => {
        const pollRequests = new Subject<string>();
        const fakeDriver = {
            getBuffered: stub()
        };
        const DRIVER_RESULT = '6';

        fakeDriver.getBuffered.resolves(Promise.resolve(DRIVER_RESULT));
        const output = spy();
        monitorByAddress(pollRequests, fakeDriver)
            .subscribe(output, console.error.bind(console), console.log.bind(console, 'completed'));

        expect(fakeDriver.getBuffered).to.have.callCount(0);

        pollRequests.next('/foo/bar');

        expect(fakeDriver.getBuffered).to.have.callCount(1);
        expect(fakeDriver.getBuffered).to.have.been.calledWith(`getPlayerShip(-1):getRotation()`);

        // "wait" for the driver's result
        await delay(1);
        expect(output).to.have.callCount(1);
        expect(output).to.have.been.calledWith({address: '/foo/bar', args: [{type: 'f', value: DRIVER_RESULT}]});

        pollRequests.complete();
    });

});
