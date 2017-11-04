import {expect} from 'chai';
import {translateAddressToGameQuery} from "../../src/osc-bridge/translate";
import {processGeneratedSchema} from "../../src/osc-bridge/process-schema";

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe('processGeneratedSchema', () => {
    it('works on simple input', () => {
        const input = {
            "global": {
                "getPlayerShip": {
                    "arguments": 1,
                    "type": "PlayerSpaceship"
                }
            },
            "PlayerSpaceship": {
                "$inherits": "SpaceShip"
            },
            "SpaceShip": {
                "$inherits": "ShipTemplateBasedObject"
            },
            "ShipTemplateBasedObject": {
                "getHull": {
                    "arguments": 0,
                    "type": "float"
                }
            }
        };
        const output = processGeneratedSchema(input);
        for (let k in input) {
            expect(output[k], 'output.' + k).to.be.ok;
        }
        expect(output.global['player-ship'].read.type, 'output.global.getPlayerShip.type').to.equal(output.PlayerSpaceship);
        expect(output.global['player-ship'].read.methodName, 'output.global.getPlayerShip.type').to.equal("getPlayerShip");
        expect(output.PlayerSpaceship.hull, 'output.PlayerSpaceship.getHull').to.equal(output.ShipTemplateBasedObject.hull);

        expect(output.PlayerSpaceship.hull.read.type, 'output.global.getPlayerShip.type').to.equal('float');
        expect(output.PlayerSpaceship.hull.read.methodName, 'output.global.getPlayerShip.type').to.equal("getHull");

    });
});

describe('translateAddressToGameQuery', () => {

    it('meaningless address throws', () => {
        expect(() => translateAddressToGameQuery('/foo/bar')).to.throw(Error);
    });

    it('incomplete expression throws', () => {
        expect(() => translateAddressToGameQuery('/ee/player-ship')).to.throw(Error);
    });

    it('expression that does not resolve to primitive throws', () => {
        expect(() => translateAddressToGameQuery('/ee/player-ship/-1')).to.throw(Error);
    });

    it('ee/playership/-1/hull', () => {
        const q = translateAddressToGameQuery('/ee/player-ship/-1/hull');
        expect(q).to.eql({
            "address": "/ee/player-ship/-1/hull",
            "expr": "getPlayerShip(-1):getHull()",
            "type": "f"
        });
    });
});
