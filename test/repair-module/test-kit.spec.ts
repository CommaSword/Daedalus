import {expect} from 'chai';

import {InfraSystem, RepairLogic} from "../../src/repair-module/logic";
import {System2} from "../../src/repair-module/systems";
import {setTimedInterval} from "../../src/core/timing";
import {getLinearOverloadDeriviation, getLinearDeriviation} from "./test-kit";

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

    it('getLinearOverloadDeriviation', async () => {
        const graceFactor = 0.1;
        const status = new System2(InfraSystem.A2);
        let timer = setTimedInterval(delta => {
            status.overload = status.overload + (GAIN_PER_MILLISECOND * delta);
        }, RepairLogic.tickInterval);

        try {
            expect(await getLinearOverloadDeriviation(status, graceFactor)).to.be.approximately(GAIN_PER_MILLISECOND, GAIN_PER_MILLISECOND * graceFactor);
        } finally {
            clearInterval(timer);
        }
    });
});
