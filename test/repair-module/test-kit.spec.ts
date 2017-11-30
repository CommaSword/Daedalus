import {expect} from 'chai';

import {InfraSystem, RepairModule} from "../../src/repair-module/repair";
import {System2} from "../../src/repair-module/systems";
import {setTimedInterval} from "../../src/core/timing";
import {getLinearCorruptionDeriviation, getLinearDeriviation} from "./test-kit";

// just some number. any number should do
const GAIN_PER_MILLISECOND = 0.123;

describe('test-driver', () => {
    it('getLinearDeriviation', async () => {
        expect(await getLinearDeriviation(async () => Date.now(), {
            iterations: 10,
            graceFactor: 0.1,
            tickInterval: 1
        })).to.be.approximately(1, 0.1);
        expect(await getLinearDeriviation(async () => Date.now() * 2, {
            iterations: 10,
            graceFactor: 0.1,
            tickInterval: 1
        })).to.be.approximately(2, 0.1);
    });

    it('getLinearCorruptionDeriviation', async () => {
        const graceFactor = 0.1;
        const status = new System2(InfraSystem.activeCollector);
        let timer = setTimedInterval(delta => {
            status.corruption = status.corruption + (GAIN_PER_MILLISECOND * delta);
        }, RepairModule.tickInterval);

        try {
            expect(await getLinearCorruptionDeriviation(status, graceFactor)).to.be.approximately(GAIN_PER_MILLISECOND, GAIN_PER_MILLISECOND * graceFactor);
        } finally {
            clearInterval(timer);
        }
    });
});
