import {expect} from 'chai';
import {OscBridge, translateAddressToQuery} from '../../src/osc/bridge';

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe('translateAddressToQuery', () => {

    it('meaningless address returns null', () => {
        const q = translateAddressToQuery('foo/bar');
        expect(q).to.eql(null);
    });

    it('incomplete expression returns null', () => {
        const q = translateAddressToQuery('ee/playership');
        expect(q).to.eql(null);
    });

    it('expression that does not resolve to primitive returns null', () => {
        const q = translateAddressToQuery('ee/playership/-1');
        expect(q).to.eql(null);
    });

    it('ee/playership/-1/hull', () => {
        const q = translateAddressToQuery('ee/playership/-1/hull');
        expect(q).to.eql({
            query: 'getPlayerShip(-1):getHull()',
            type: 'f',
        });
    });
});
