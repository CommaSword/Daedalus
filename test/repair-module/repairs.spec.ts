import {expect} from 'chai';
import {InfraSystem, RepairModule} from "../../src/repairs/repair";
import {ESystem} from "../../src/empty-epsilon/model";
import {match, spy} from 'sinon';
import {System1, System2, System2Status} from "../../src/repairs/systems";
import {approx, getLinearCorruptionDeriviation, graceFactor, timePerTest} from "./drivers";

describe('repair module', () => {

    const sideEffects = {
        setRepairRate: spy(),
        setHeatRate: spy(),
        setMaxPower: spy()
    };

    let repair: RepairModule;

    beforeEach('init module', () => {
        repair = new RepairModule(sideEffects);
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
        const repair = new RepairModule(sideEffects);
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
        repair.shutdownSystem2(InfraSystem.dilithiumParticleGenerator);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, match.number.and(match((n: number) => n <= System1.maxSupportedPower)));
        expect(sideEffects.setMaxPower).to.have.not.been.calledWith(ESystem.Impulse, System1.maxOverPower);
    });

    it('When a supporting system2 is offline, the maximum level of a system1’s power will be at most: ' +
        '100%  * number of online supporting systems/ number of supporting systems', () => {
        sideEffects.setMaxPower.reset();
        repair.shutdownSystem2(InfraSystem.activeCollector);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, approx(System1.maxSupportedPower * 2 / 3));
        sideEffects.setMaxPower.reset();
        repair.shutdownSystem2(InfraSystem.polaronLimiter);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxSupportedPower / 3);
        sideEffects.setMaxPower.reset();
        repair.shutdownSystem2(InfraSystem.dilithiumParticleGenerator);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, 0);
        sideEffects.setMaxPower.reset();
        repair.startupSystem2(InfraSystem.dilithiumParticleGenerator);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxSupportedPower / 3);
        sideEffects.setMaxPower.reset();
        repair.startupSystem2(InfraSystem.polaronLimiter);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, approx(System1.maxSupportedPower * 2 / 3));
        sideEffects.setMaxPower.reset();
        repair.startupSystem2(InfraSystem.activeCollector);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxOverPower);
    });

    describe('When a system1 is over-powered', () => {
        let activeCollectorStatus: System2Status;
        beforeEach(() => {
            activeCollectorStatus = repair.getSystem2Status(InfraSystem.activeCollector);
        });

        it('its supporting system2s accumulate corruption', async () => {
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower);
            expect(await getLinearCorruptionDeriviation(activeCollectorStatus)).to.eql(0);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 2);
            expect(await getLinearCorruptionDeriviation(activeCollectorStatus)).to.be.gt(0);
        }).timeout(timePerTest * 2 + 2000);

        it('The corruption rate is linear to the level of extra energy', async () => {
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 1.5);
            expect(await getLinearCorruptionDeriviation(activeCollectorStatus), '1.5 power').to.be.approximately(System2.corruptionPerMillisecond * 0.5, System2.corruptionPerMillisecond * graceFactor);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 2);
            await Promise.resolve();
            expect(await getLinearCorruptionDeriviation(activeCollectorStatus), '2 power').to.be.approximately(System2.corruptionPerMillisecond, System2.corruptionPerMillisecond * graceFactor);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 2.5);
            expect(await getLinearCorruptionDeriviation(activeCollectorStatus), '2.5 power').to.be.approximately(System2.corruptionPerMillisecond * 1.5, System2.corruptionPerMillisecond * graceFactor);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 3);
            expect(await getLinearCorruptionDeriviation(activeCollectorStatus), '3 power').to.be.approximately(System2.corruptionPerMillisecond * 2, System2.corruptionPerMillisecond * graceFactor);
        }).timeout(timePerTest * 4 + 2000);
    });

    describe('When one or more supporting system2 is in error state', () => {

        it('the supported system1 begins accumulating heat (the rate does not change according to the amount of systems in error)', () => {
            repair.setError(InfraSystem.activeCollector);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, approx(System1.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.setError(InfraSystem.polaronLimiter);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, approx(System1.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.shutdownSystem2(InfraSystem.activeCollector);
            repair.shutdownSystem2(InfraSystem.polaronLimiter);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, 0);
        });

        it('the repair rate of supported system1 is 50% the normal rate', () => {
            repair.startRepairingSystem1(ESystem.JumpDrive);
            repair.setError(InfraSystem.dilithiumParticleGenerator);
            expect(sideEffects.setRepairRate, `after 1st error`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate * 0.5));
            sideEffects.setRepairRate.reset();
            repair.setError(InfraSystem.polaronLimiter);
            expect(sideEffects.setRepairRate, `after 2nd error`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate * 0.5));
            sideEffects.setRepairRate.reset();
            repair.shutdownSystem2(InfraSystem.dilithiumParticleGenerator);
            repair.shutdownSystem2(InfraSystem.polaronLimiter);
            expect(sideEffects.setRepairRate, `after shutdowns`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate));
        });
    });
});
