import {getMonitoredAddresses, monitorByAddress} from "../../src/osc-bridge/game-monitor";
import {Subject} from "rxjs";
import {spy, stub} from "sinon";
import {expect} from "chai";
import {MemoryFileSystem} from "kissfs";

function delay(timeout: number) {
    return new Promise(r => setTimeout(r, timeout));
}

describe('getMonitoredAddresses', () => {

    const INITIAL_VALUE = ['/foo/bar'];
    const OTHER_VALUE = ['/foo', '/foo/bar', 'foo2/bar'];
    let fs: MemoryFileSystem;

    beforeEach(async () => {
        fs = new MemoryFileSystem();
        await fs.saveFile('game-monitor.json', JSON.stringify(INITIAL_VALUE));
    });

    it('reads file correctly', async () => {
        const monitored = await getMonitoredAddresses(fs);
        expect(monitored).to.eql(INITIAL_VALUE);
    });

    it('tracks changes', async () => {
        const monitored = await getMonitoredAddresses(fs);
        await fs.saveFile('game-monitor.json', JSON.stringify(OTHER_VALUE));
        expect(monitored).to.eql(OTHER_VALUE);
    });

    it('ignores invalid changes', async () => {
        const monitored = await getMonitoredAddresses(fs);
        await fs.saveFile('game-monitor.json', 'fooooo');
        expect(monitored).to.eql(INITIAL_VALUE);
    });
});


describe('monitorByAddress', () => {

    const pollRequests = new Subject<string>();
    const fakeDriver = {
        getBuffered: stub()
    };
    const DRIVER_RESULT = '6';
    const output = spy();


    it('basically works', async () => {
        monitorByAddress(pollRequests, fakeDriver)
            .subscribe(output, console.error.bind(console), console.log.bind(console, 'completed'));

        expect(fakeDriver.getBuffered).to.have.callCount(0);

        fakeDriver.getBuffered.resolves(Promise.resolve(DRIVER_RESULT));

        pollRequests.next('/ee/player-ship/-1/rotation');

        expect(fakeDriver.getBuffered).to.have.callCount(1);
        expect(fakeDriver.getBuffered).to.have.been.calledWith(`getPlayerShip(-1):getRotation()`);

        // "wait" for the driver's result
        await delay(1);
        expect(output).to.have.callCount(1);
        expect(output).to.have.been.calledWith({address: '/ee/player-ship/-1/rotation', args: [{type: 'f', value: DRIVER_RESULT}]});

    });

});
