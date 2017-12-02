import {expect} from 'chai';
import {setTimedInterval} from "../../src/core/timing";


function delay(timeout: number) {
    return new Promise(r => setTimeout(r, timeout));
}

describe('setTimedInterval', () => {
    it('works', async () => {
        const deltas: number[] = [];
        let timer = setTimedInterval(delta => deltas.push(delta), 10);
        try {
            await new Promise(res => setTimeout(res, 111));
            expect(deltas.length).to.be.gte(9);
            deltas.forEach((delta) => {
                expect(delta).to.be.gt(8);
                expect(delta).to.be.lt(15);
            });
        } finally {
            clearInterval(timer);
        }
    });
});

