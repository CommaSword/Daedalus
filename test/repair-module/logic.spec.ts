import {expect} from 'chai';
import {InfraSystem, RepairLogic} from "../../src/repair-module/logic";
import {ESystem} from "../../src/empty-epsilon/model";
import {match, spy} from 'sinon';
import {System1, System2, System2Status} from "../../src/repair-module/systems";
import {approx, getLinearOverloadDeriviation} from "./test-kit";
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";

const graceFactor = 0.1;
describe('repair module', () => {

    const sideEffects = {
        setRepairRate: spy(),
        setHeatRate: spy(),
        setMaxPower: spy(),
        powerInput: undefined as any as Subscriber<{ system: ESystem, power: number }>,
        powerUpdates: undefined as any as Observable<{ system: ESystem, power: number }>
    };

    sideEffects.powerUpdates = new Observable<{ system: ESystem, power: number }>(subscriber => sideEffects.powerInput = subscriber);

    let repair: RepairLogic;

    beforeEach('init module', () => {
        repair = new RepairLogic(sideEffects);
        repair.init();
        for (let s2 = 0; s2 < InfraSystem.COUNT; s2++) {
            repair.startupSystem2(s2);
        }
    });

    afterEach(`reset sideEffects`, () => {
        repair.destroy();
        sideEffects.setRepairRate.reset();
        sideEffects.setHeatRate.reset();
        sideEffects.setMaxPower.reset();
    });

    it('exposes all the systems', () => {
        const repair = new RepairLogic(sideEffects);
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            expect(repair.getSystem1Status(s1).id).to.eql(s1);
        }
        for (let s2 = 0; s2 < InfraSystem.COUNT; s2++) {
            expect(repair.getSystem2Status(s2).id).to.eql(s2);
        }
    });

    it('.startRepairingSystem1(x), .stopRepairingSystem1() affect side effects repair rate and the value of .repairing', () => {
        repair.startRepairingSystem1(ESystem.JumpDrive);
        expect(sideEffects.setRepairRate).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate));
        expect(repair.repairing).to.eql(ESystem.JumpDrive);
        repair.stopRepairingSystem1();
        expect(sideEffects.setRepairRate).to.have.been.calledWith(ESystem.JumpDrive, 0);
        expect(repair.repairing).to.eql(null);
    });

    it('requires to stop repairing a system before repairing another one', () => {
        repair.startRepairingSystem1(ESystem.JumpDrive);
        expect(() => repair.startRepairingSystem1(ESystem.RearShield)).to.throw(Error);
    });

    it('does not throw on repair command for currently repairing system', () => {
        repair.startRepairingSystem1(ESystem.JumpDrive);
        expect(() => repair.startRepairingSystem1(ESystem.JumpDrive)).not.to.throw(Error);
    });

    it('A system1 can only be over-powered (more than 100% energy) when all of its supporting system2s are online', () => {
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxOverPower);
        sideEffects.setMaxPower.reset();
        repair.shutdownSystem2(InfraSystem.switch_B);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, match.number.and(match((n: number) => n <= System1.maxSupportedPower)));
        expect(sideEffects.setMaxPower).to.have.not.been.calledWith(ESystem.Impulse, System1.maxOverPower);
    });

    it('When a supporting system2 is offline, the maximum level of a system1’s power will be at most: ' +
        '100%  * number of online supporting systems/ number of supporting systems', () => {
        sideEffects.setMaxPower.reset();
        repair.shutdownSystem2(InfraSystem.switch_B);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, approx(System1.maxSupportedPower /2));
        sideEffects.setMaxPower.reset();
        repair.shutdownSystem2(InfraSystem.switch_C);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, 0);
        sideEffects.setMaxPower.reset();
        repair.startupSystem2(InfraSystem.switch_C);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, approx(System1.maxSupportedPower /2));
        sideEffects.setMaxPower.reset();
        repair.startupSystem2(InfraSystem.switch_B);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxOverPower);
    });

    describe('When a system1 is over-powered', () => {
        let activeCollectorStatus: System2Status;
        beforeEach(() => {
            activeCollectorStatus = repair.getSystem2Status(InfraSystem.switch_B);
        });

        it('its supporting system2s accumulate overload', async () => {
            sideEffects.powerInput.next({system: ESystem.Impulse, power: System1.maxSupportedPower});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor)).to.eql(0);
            sideEffects.powerInput.next({system: ESystem.Impulse, power: System1.maxSupportedPower * 2});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor)).to.be.gt(0);
        }).timeout(10 * 1000);

        it('The overload rate is linear to the level of extra energy', async () => {
            sideEffects.powerInput.next({system: ESystem.Impulse, power: System1.maxSupportedPower * 1.5});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '1.5 power').to.be.approximately(System2.overloadPerMillisecond * 0.5, System2.overloadPerMillisecond * graceFactor);
            sideEffects.powerInput.next({system: ESystem.Impulse, power: System1.maxSupportedPower * 2});
            await Promise.resolve();
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '2 power').to.be.approximately(System2.overloadPerMillisecond, System2.overloadPerMillisecond * graceFactor);
            sideEffects.powerInput.next({system: ESystem.Impulse, power: System1.maxSupportedPower * 2.5});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '2.5 power').to.be.approximately(System2.overloadPerMillisecond * 1.5, System2.overloadPerMillisecond * graceFactor);
            sideEffects.powerInput.next({system: ESystem.Impulse, power: System1.maxSupportedPower * 3});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '3 power').to.be.approximately(System2.overloadPerMillisecond * 2, System2.overloadPerMillisecond * graceFactor);
        }).timeout(20 * 1000);
    });

    it('When a system2’s overload level reaches its overload threshold, it goes into error state', () => {
        const system2 = repair.getSystem2Status(InfraSystem.switch_E) as System2;
        expect(system2.isError).to.eql(false);
        repair.addOverloadToSystem2(InfraSystem.switch_E, system2.overloadErrorThreshold);
        expect(system2.isError).to.eql(false);
        repair.addOverloadToSystem2(InfraSystem.switch_E, 0.00001);
        expect(system2.isError).to.eql(true);
    });

    describe('When one or more supporting system2 is in error state', () => {

        it('the supported system1 begins accumulating heat (the rate does not change according to the amount of systems in error)', () => {
            repair.setError(InfraSystem.switch_B);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, approx(System1.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.setError(InfraSystem.switch_C);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, approx(System1.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.shutdownSystem2(InfraSystem.switch_B);
            repair.shutdownSystem2(InfraSystem.switch_C);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, 0);
        });

        it('the repair rate of supported system1 is 50% the normal rate', () => {
            repair.startRepairingSystem1(ESystem.JumpDrive);
            repair.setError(InfraSystem.switch_F);
            expect(sideEffects.setRepairRate, `after 1st error`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate * 0.5));
            sideEffects.setRepairRate.reset();
            repair.setError(InfraSystem.switch_C);
            expect(sideEffects.setRepairRate, `after 2nd error`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate * 0.2));
            sideEffects.setRepairRate.reset();
            repair.shutdownSystem2(InfraSystem.switch_F);
            repair.shutdownSystem2(InfraSystem.switch_C);
            expect(sideEffects.setRepairRate, `after shutdowns`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate));
        });
    });
});
