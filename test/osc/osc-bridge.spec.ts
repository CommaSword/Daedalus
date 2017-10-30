import {expect} from 'chai';
import {spy} from 'sinon';
import {OscBridge} from '../../src/osc/bridge';

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe('OSC Bridge', () => {
    it('querys the driver for the given address and returns the answer every second', async () => {
        const get = spy();
        const driver = {
            get: get
        };
        const address = 'ee/playership/1/hull';
        const bridge = new OscBridge(driver);
        bridge.cast(address, 50);
        await sleep(200);
        expect(get.getCall(0).args[0]).to.equal('getPlayerShip(1):getHull()');
        expect(get.callCount).to.be.greaterThan(2);
    });
});
