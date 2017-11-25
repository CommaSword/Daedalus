import {expect} from 'chai';

import {InfraSystem, RepairModule} from "../../src/repairs/repair";
import {System2} from "../../src/repairs/systems";
import {setTimedInterval} from "../../src/core/timing";
import {getLinearCorruptionDeriviation, graceFactor} from "./drivers";

// just some number. any number should do
const GAIN_PER_MILLISECOND = 0.123;

describe('(test-driver) getLinearCorruptionDeriviation', () => {
    it('works', async () => {
        const status = new System2(InfraSystem.activeCollector);
        let timer = setTimedInterval(delta => {
            status.corruption = status.corruption + (GAIN_PER_MILLISECOND * delta);
        }, RepairModule.tickInterval);

        try {
            expect(await getLinearCorruptionDeriviation(status)).to.be.approximately(GAIN_PER_MILLISECOND, GAIN_PER_MILLISECOND * graceFactor);
        } finally {
            clearInterval(timer);
        }
    });
});
