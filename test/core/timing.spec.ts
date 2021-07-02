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
            await new Promise(res => setTimeout(res, 100));
            expect(deltas.length).to.be.gte(5);
            deltas.forEach((delta) => {
                expect(delta).to.be.gt(5);
                expect(delta).to.be.lt(30);
            });
        } finally {
            clearInterval(timer);
        }
    });
});

