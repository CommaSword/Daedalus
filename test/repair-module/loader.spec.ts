import {makeRepairDriver} from "../../src/repair-module/loader";
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";
import {ESystem} from "../../src/empty-epsilon/model";
import {beforeAndAfter} from '../test-kit/empty-epsylon-server-manager'
import {HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {Driver} from "../../src/repair-module/repair";
import {retry} from "../test-kit/retry";
import {System1} from "../../src/repair-module/systems";


describe('repair-module loader', () => {
    describe('makeRepairDriver', async () => {
        let pulser: Subscriber<null>;
        let httpDriver: HttpDriver;
        let repairDriver: Driver;
        beforeAndAfter(config);
        beforeEach(async () => {
            let pulse: Observable<any> = new Observable<null>((s: Subscriber<null>) => pulser = s);
            httpDriver = new HttpDriver(config.serverAddress);
            repairDriver = await makeRepairDriver(httpDriver, pulse);
        });

        async function powerUpdate() {
            const updates: any[] = [];

            const subscription = repairDriver.powerUpdates.subscribe(update => updates.push(update));
            pulser.next();
            await  retry(() => {
                expect(updates.length).to.equal(ESystem.COUNT)
            }, {interval: 30, timeout: 1500});
            subscription.unsubscribe();
            return updates;
        }

        it('powerUpdates', async () => {
            const updates = await powerUpdate();

            const expected = Array.from(Array(ESystem.COUNT)).map((_, i) => ({
                system: i,
                power: System1.maxSupportedPower
            }));

            expect(updates).to.eql(expected);
        });

        it('setMaxPower', async () => {
            const MAX_POWER_TEST_VAL = 0.3;
            const SYSTEM = ESystem.MissileSystem;

            await repairDriver.setMaxPower(SYSTEM, MAX_POWER_TEST_VAL);
            const updates = await powerUpdate();
            const expected = Array.from(Array(ESystem.COUNT)).map((_, i) => ({
                system: i,
                power: i === SYSTEM ? MAX_POWER_TEST_VAL : System1.maxSupportedPower
            }));
            expect(updates).to.eql(expected);
        });
    });
});
