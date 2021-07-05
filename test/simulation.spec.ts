import {MemoryFileSystem} from "kissfs";
import {expect} from 'chai';
import {getMonitoredAddresses} from "../src/simulation";

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
