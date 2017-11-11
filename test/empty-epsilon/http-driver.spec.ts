import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';

describe('EE HTTP Driver', () => {
    beforeAndAfter(config);

    async function expectShipState(httpDriver: HttpDriver, eRotation: number, eHull: number) {
        let rotation = httpDriver.query('getPlayerShip(-1):getRotation()');
        let hull = httpDriver.query('getPlayerShip(-1):getHull()');
        expect(await rotation, 'rotation').to.eql(eRotation);
        expect(await hull, 'hull').to.eql(eHull);
        return {rotation, hull};
    }

    async function setShipState(httpDriver: HttpDriver, sRotation: string, sHull: string) {
        let rotation = httpDriver.execute('getPlayerShip(-1):setRotation', sRotation);
        let hull = httpDriver.execute('getPlayerShip(-1):setHull', sHull);
        await rotation;
        await hull
    }

    it('gets rotation and heading', async function () {
        let httpDriver = new HttpDriver(config.serverAddress);
        await expectShipState(httpDriver, 0, 250);
        await setShipState(httpDriver, '0', '122');
        // await ship.setHull(50);
        await expectShipState(httpDriver, 0, 122);
    });

    it('gets multiple values', async function () {
        let httpDriver = new HttpDriver(config.serverAddress);
        let pos = httpDriver.query('getPlayerShip(-1):getPosition()', 2);
        expect(await pos, 'position').to.eql([0,0]);
    });
});
