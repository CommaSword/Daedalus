import {Pulser} from "../../src/core/pulser";
import {expect} from 'chai';


function delay(timeout: number) {
    return new Promise(r => setTimeout(r, timeout));
}

describe('pulser', () => {
    let pulser: Pulser;
    let calls: number[] = [];

    beforeEach(() => {
        pulser = new Pulser();
        pulser.pulseInterval = 2;
        pulser.pulse.subscribe(p => calls.push(p));
    });
    afterEach(() => {
        calls = [];
        pulser.stop()
    });

    it('does not pulse before start', async () => {
        await delay(pulser.pulseInterval * 2);
        expect(calls).to.have.length(0);
    });

    it('pulses every pulseInterval', async () => {

        pulser.start();
        expect(calls).to.eql([0]);

        await delay(pulser.pulseInterval);
        expect(calls).to.have.length.gte(2);
        expect(calls).to.contain.members([0, 1]);
        const clonedCalls = [...calls];

        await delay(pulser.pulseInterval);
        expect(calls).to.have.length.gte(clonedCalls.length + 1);
        expect(calls).to.contain.members([0, 1, 2]);
        expect(calls).to.contain.members([...clonedCalls, clonedCalls.length]);

    });
});
