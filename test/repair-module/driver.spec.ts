import {heat_per_second, repair_per_second, EcrDriver} from "../../src/ecr/driver";
import {Observable, Subscriber} from "rxjs";
import {ESystem} from "../../src/empty-epsilon/model";
import {eeTestServerLifecycle} from '../test-kit/empty-epsylon-server-manager'
import {HttpDriver} from '../../src/empty-epsilon/driver';
import config from '../test-kit/config';
import {expect} from 'chai';
import {retry} from "../test-kit/retry";
import {PrimarySystem} from "../../src/ecr/systems";
import {getLinearDeriviation} from "./test-kit";


describe('EcrDriver', async () => {
    let pulser: Subscriber<null>;
    let httpDriver: HttpDriver;
    let repairDriver: EcrDriver;
    eeTestServerLifecycle(config);
    beforeEach(async () => {
        let pulse: Observable<any> = new Observable<null>((s: Subscriber<null>) => pulser = s);
        httpDriver = new HttpDriver(config.serverAddress);
        repairDriver = new EcrDriver(httpDriver, pulse);
        await repairDriver.init();
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
            power: PrimarySystem.maxSupportedPower
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
            power: i === SYSTEM ? MAX_POWER_TEST_VAL : PrimarySystem.maxSupportedPower
        }));
        expect(updates).to.eql(expected);
    });

    it('setRepairRate', async function () {
        this.timeout(20 * 1000);
        const graceFactor = 0.5;

        const SYSTEM = ESystem.MissileSystem;
        await httpDriver.command(`getPlayerShip(-1):setSystemHealth('${ESystem[SYSTEM]}', {0})`, ['0.1']);

        const scale = 10000;
        const repairRate = 0.5;
        await repairDriver.setRepairRate(SYSTEM, repairRate);

        const expected = scale * repairRate * repair_per_second / 1000;
        expect(await getLinearDeriviation(() => httpDriver.query<number>(`getPlayerShip(-1):getSystemHealth('${ESystem[SYSTEM]}') * ${scale}`), {
            iterations: 4,
            graceFactor,
            tickInterval: 10
        })).to.be.approximately(expected, expected * graceFactor);

    });


    it('setHeatRate', async function () {
        this.timeout(20 * 1000);
        const graceFactor = 0.2;

        const SYSTEM = ESystem.MissileSystem;

        const scale = 10000;
        const heatRate = 0.5;
        await repairDriver.setHeatRate(SYSTEM, heatRate);
        //    await new Promise(res => setTimeout(res, 100));
        const expected = scale * heatRate * heat_per_second / 1000;
        expect(await getLinearDeriviation(() => httpDriver.query<number>(`getPlayerShip(-1):getSystemHeat('${ESystem[SYSTEM]}') * ${scale}`), {
            iterations: 4,
            graceFactor,
            tickInterval: 10
        })).to.be.approximately(expected, expected * graceFactor);

    });

});
