import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {EmptyEpsilonDriver, HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {ESystem} from "../../src/empty-epsilon/objects/space-ship";
import {PlayerShip} from "../../src/empty-epsilon/objects/player-ship";

describe.only('HTTP Server Driver', () => {
    beforeAndAfter(config);
    it('gets gets rotation and heading ', async function () {
        let ship = new EmptyEpsilonDriver(config.serverAddress).getPlayerShip();
        let httpDriver = new HttpDriver(config.serverAddress);
        let rotation = httpDriver.getBuffered('getPlayerShip(-1):getRotation()');
        let hull = httpDriver.getBuffered('getPlayerShip(-1):getHull()');
        await httpDriver.flush();
        expect(await rotation, 'rotation').to.eql(0);
        expect(await hull, 'hull').to.eql(250);
        await ship.setHull(50);
        rotation = httpDriver.getBuffered('getPlayerShip(-1):getRotation()');
        hull = httpDriver.getBuffered('getPlayerShip(-1):getHull()');
        await httpDriver.flush();
        expect(await rotation, 'rotation').to.eql(0);
        expect(await hull, 'hull').to.eql(50);
        // expect(await ship.getPosition()).to.eql([0, 0]);
        // await ship.setPosition(123, 321);
        // expect(await ship.getPosition()).to.eql([123, 321]);
    });
});
