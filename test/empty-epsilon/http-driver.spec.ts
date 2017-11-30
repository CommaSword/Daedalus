import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';

describe('EE HTTP Driver', () => {
    beforeAndAfter(config);
    let httpDriver: HttpDriver;
    beforeEach(() => {
        httpDriver = new HttpDriver(config.serverAddress);
    });

    async function expectShipState(httpDriver: HttpDriver, eRotation: number, eHull: number) {
        let rotation = httpDriver.query('getPlayerShip(-1):getRotation()');
        let hull = httpDriver.query('getPlayerShip(-1):getHull()');
        expect(await rotation, 'rotation').to.eql(eRotation);
        expect(await hull, 'hull').to.eql(eHull);
        return {rotation, hull};
    }

    async function setShipState(httpDriver: HttpDriver, sRotation: string, sHull: string) {
        let rotation = httpDriver.command('getPlayerShip(-1):setRotation({0})', [sRotation]);
        let hull = httpDriver.command('getPlayerShip(-1):setHull({0})', [sHull]);
        await rotation;
        await hull
    }

    it('gets rotation and heading', async function () {
        await expectShipState(httpDriver, 0, 250);
        await setShipState(httpDriver, '0', '122');
        // await ship.setHull(50);
        await expectShipState(httpDriver, 0, 122);
    });

    it('gets multiple values', async function () {
        let pos = httpDriver.query('getPlayerShip(-1):getPosition()', 2);
        expect(await pos, 'position').to.eql([0, 0]);
    });

    it('run script', async function () {
        await  httpDriver.command(`
_G.d = Script()
_G.d:setVariable("arg_1", 42)
_G.d:run("_daedalus_test_1.lua")
`, []);
        //   await new Promise(res => setTimeout(res, 100));
        await expectShipState(httpDriver, 0, 42);
    });

    it('run script2', async function () {
        const startTime = Date.now();
        await  httpDriver.command(`
_G.counter = 0
_G.d = Script()
_G.d:setVariable("arg_1", 42)
_G.d:run("_daedalus_test_1.lua")
_G.hooks.foo = function (delta)
    _G.counter = _G.counter + delta
end
`, []);
        const execTime = Date.now();

        await new Promise(res => setTimeout(res, 100));
        const endtTime = Date.now();


        let counter = await httpDriver.query('_G.counter * 1000');
        expect(counter).to.lt(execTime - startTime + endtTime - startTime);
        expect(counter).to.gt(100);
    });
});
