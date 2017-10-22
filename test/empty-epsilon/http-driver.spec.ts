import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver, HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';

describe('EE HTTP Driver', () => {
    beforeAndAfter(config);

    async function expectShipState(httpDriver: HttpDriver, eRotation: number, eHull:number) {
        let rotation = httpDriver.getBuffered('getPlayerShip(-1):getRotation()');
        let hull = httpDriver.getBuffered('getPlayerShip(-1):getHull()');
        expect(await rotation, 'rotation').to.eql(eRotation);
        expect(await hull, 'hull').to.eql(eHull);
        return {rotation, hull};
    }

    it('gets rotation and heading ', async function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        let httpDriver = new HttpDriver(config.serverAddress);
        await expectShipState(httpDriver, 0, 250);
        await ship.setHull(50);
        await expectShipState(httpDriver, 0, 50);
    });
});
