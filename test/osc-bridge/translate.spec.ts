import {expect} from 'chai';
import {translateAddressToGameQuery, translateOscMessageToGameCommand} from "../../src/osc-bridge/translate";
import {GeneratedSchema, processGeneratedSchema} from "../../src/osc-bridge/process-schema";

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe('processGeneratedSchema', () => {
    it('works on simple input', () => {
        const input = {
            "global": {
                "getPlayerShip": {
                    "arguments": ["integer"],
                    "type": ["PlayerSpaceship"]
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
                    "arguments": [],
                    "type": ["float"]
                },
                "setHull": {
                    "arguments": ["float"],
                    "type": []
                },
            }
        } as GeneratedSchema;
        const output = processGeneratedSchema(input) as any;
        for (let k in input) {
            expect(output[k], 'output.' + k).to.be.ok;
        }
        expect(output.global['player-ship'].get.type, 'output.global.getPlayerShip.type').to.equal(output.PlayerSpaceship);
        expect(output.global['player-ship'].get.methodName, 'output.global.getPlayerShip.methodName').to.equal("getPlayerShip");
        expect(output.PlayerSpaceship.hull, 'output.PlayerSpaceship.hull').to.equal(output.ShipTemplateBasedObject.hull);

        expect(output.PlayerSpaceship.hull.get, 'output.PlayerSpaceship.hull.get').to.be.ok;
        expect(output.PlayerSpaceship.hull.get.type, 'output.PlayerSpaceship.hull.get.type').to.eql(['float']);
        expect(output.PlayerSpaceship.hull.get.methodName, 'output.PlayerSpaceship.hull.get.methodName').to.equal("getHull");


        expect(output.PlayerSpaceship.hull.set, 'output.PlayerSpaceship.hull.set').to.be.ok;
        expect(output.PlayerSpaceship.hull.set.arguments, 'output.PlayerSpaceship.hull.set.arguments').to.eql(["float"]);
        expect(output.PlayerSpaceship.hull.set.methodName, 'output.PlayerSpaceship.hull.set.methodName').to.equal("setHull");

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

    it('basic : ee/playership/-1/hull', () => {
        const q = translateAddressToGameQuery('/ee/player-ship/-1/hull');
        expect(q).to.eql({
            "address": "/ee/player-ship/-1/hull",
            "expr": "getPlayerShip(-1):getHull()",
            "type": "f"
        });
    });

    it('multiple returns : ee/playership/-1/position', () => {
        const q = translateAddressToGameQuery('/ee/player-ship/-1/position');
        expect(q).to.eql({
            "address": "/ee/player-ship/-1/position",
            "expr": "getPlayerShip(-1):getPosition()",
            "type": "ff"
        });
    });
});


describe('translateOscMessageToGameCommand', () => {

    it('meaningless address throws', () => {
        expect(() => translateOscMessageToGameCommand({address: '/foo/bar', args: []})).to.throw(Error);
    });

    it('incomplete expression throws', () => {
        expect(() => translateOscMessageToGameCommand({address: '/ee/player-ship', args: []})).to.throw(Error);
    });

    it('expression that does not resolve to primitive throws', () => {
        expect(() => translateOscMessageToGameCommand({address: '/ee/player-ship/-1', args: []})).to.throw(Error);
    });

    it('basic : ee/playership/-1/hull', () => {
        const q = translateOscMessageToGameCommand({address: '/ee/player-ship/-1/hull', args: [0.5]});
        expect(q).to.eql({
            "template": "getPlayerShip(-1):setHull({0})",
            "values": ["0.50"]
        });
    });

    it('with a method argument in the address (set it as part of the template, not a variable)', () => {
        const q = translateOscMessageToGameCommand({address: '/ee/player-ship/-1/system-health/reactor', args: [0.5]});
        expect(q).to.eql({
            "template": 'getPlayerShip(-1):setSystemHealth("Reactor", {0})',
            "values": ["0.50"]
        });
    });

});
