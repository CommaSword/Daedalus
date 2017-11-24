import {expect} from 'chai';
import {InfraSystem, RepairModule} from "../src/repairs/repair";
import {ESystem} from "../src/empty-epsilon/model";
import {match, spy} from 'sinon';
import {System1} from "../src/repairs/systems";


describe('repair module', () => {

    const sideEffects = {
        setRepairRate: spy(),
        setHeatRate: spy(),
        setMaxPower: spy()
    };

    let repair: RepairModule;

    beforeEach('init module', () => {
        repair = new RepairModule(sideEffects);
    });

    afterEach(`reset sideEffects`, () => {
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

    it('.startRepairing(x), .stopRepairing() affect side effects repair rate and the value of .repairing', () => {
        repair.startRepairing(ESystem.JumpDrive);
        expect(sideEffects.setRepairRate).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate));
        expect(repair.repairing).to.eql(ESystem.JumpDrive);
        repair.stopRepairing();
        expect(sideEffects.setRepairRate).to.have.been.calledWith(ESystem.JumpDrive, 0);
        expect(repair.repairing).to.eql(null);
    });

    it('requires to stop repairing a system before repairing another one', () => {
        repair.startRepairing(ESystem.JumpDrive);
        expect(() => repair.startRepairing(ESystem.RearShield)).to.throw(Error);
    });

    it('does not throw on repair command for currently repairing system', () => {
        repair.startRepairing(ESystem.JumpDrive);
        expect(() => repair.startRepairing(ESystem.JumpDrive)).not.to.throw(Error);
    });

    it('A system1 can only be over-powered (more than 100% energy) when all of its supporting system2s are online', () => {
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, 0);
        sideEffects.setMaxPower.reset();
        repair.startup(InfraSystem.dilithiumParticleGenerator);
        repair.startup(InfraSystem.polaronLimiter);
        expect(sideEffects.setMaxPower).to.have.not.been.calledWith(ESystem.Impulse, System1.maxOverPower);
        repair.startup(InfraSystem.activeCollector);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxOverPower);
    });

    it('When a supporting system2 is offline, the maximum level of a system1’s power will be at most: ' +
        '100%  * number of online supporting systems/ number of supporting systems', () => {
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, 0);
        sideEffects.setMaxPower.reset();
        repair.startup(InfraSystem.dilithiumParticleGenerator);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxSupportedPower / 3);
        sideEffects.setMaxPower.reset();
        repair.startup(InfraSystem.polaronLimiter);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, approx(System1.maxSupportedPower * 2 / 3));
        sideEffects.setMaxPower.reset();
        repair.startup(InfraSystem.activeCollector);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxOverPower);
        sideEffects.setMaxPower.reset();
        repair.shutdown(InfraSystem.activeCollector);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, approx(System1.maxSupportedPower * 2 / 3));
        sideEffects.setMaxPower.reset();
        repair.shutdown(InfraSystem.polaronLimiter);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, System1.maxSupportedPower / 3);
        sideEffects.setMaxPower.reset();
        repair.shutdown(InfraSystem.dilithiumParticleGenerator);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, 0);
    });

    describe('When one or more supporting system2 is in error state', () => {

        it('all of its supporting system2s accumulate corruption', () => {
            repair.startup(InfraSystem.activeCollector);
            repair.startup(InfraSystem.polaronLimiter);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower);
            // nothing happens
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 2);
            // InfraSystem.activeCollector and InfraSystem.polaronLimiter start gaining corruption

        });

        it('The corruption rate is linear to the level of extra energy', async () => {
            repair.startup(InfraSystem.activeCollector);
            repair.startup(InfraSystem.polaronLimiter);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 1.5);
            const baseCorruptionGain = await getLinearCorruptionGain(repair, InfraSystem.activeCollector);
            expect(baseCorruptionGain).to.be.gt(0);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 2);
            expect(await getLinearCorruptionGain(repair, InfraSystem.activeCollector)).to.be.approximately(baseCorruptionGain * 2, baseCorruptionGain * 0.01);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 2.5);
            expect(await getLinearCorruptionGain(repair, InfraSystem.activeCollector)).to.be.approximately(baseCorruptionGain * 3, baseCorruptionGain * 0.01);
            repair.setSystem1Power(ESystem.Impulse, System1.maxSupportedPower * 3);
            expect(await getLinearCorruptionGain(repair, InfraSystem.activeCollector)).to.be.approximately(baseCorruptionGain * 4, baseCorruptionGain * 0.01);
        });
    });

    describe('When one or more supporting system2 is in error state', () => {
        it('the supported system1 begins accumulating heat (the rate does not change according to the amount of systems in error)', () => {
            repair.startup(InfraSystem.activeCollector);
            repair.startup(InfraSystem.polaronLimiter);
            repair.setError(InfraSystem.activeCollector);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, approx(System1.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.setError(InfraSystem.polaronLimiter);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, approx(System1.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.shutdown(InfraSystem.activeCollector);
            repair.shutdown(InfraSystem.polaronLimiter);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(ESystem.Impulse, 0);
        });

        it('the repair rate of supported system1 is 50% the normal rate', () => {
            repair.startRepairing(ESystem.JumpDrive);
            expect(sideEffects.setRepairRate, `after startRepairing`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate));
            sideEffects.setRepairRate.reset();
            repair.startup(InfraSystem.dilithiumParticleGenerator);
            repair.startup(InfraSystem.polaronLimiter);
            repair.setError(InfraSystem.dilithiumParticleGenerator);
            expect(sideEffects.setRepairRate, `after 1st error`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate * 0.5));
            sideEffects.setRepairRate.reset();
            repair.setError(InfraSystem.polaronLimiter);
            expect(sideEffects.setRepairRate, `after 2nd error`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate * 0.5));
            sideEffects.setRepairRate.reset();
            repair.shutdown(InfraSystem.dilithiumParticleGenerator);
            repair.shutdown(InfraSystem.polaronLimiter);
            expect(sideEffects.setRepairRate, `after shutdowns`).to.have.been.calledWith(ESystem.JumpDrive, approx(System1.repairRate));
        });
    });
});

async function getLinearCorruptionGain(repair: RepairModule, sys2: InfraSystem) {
    const status = repair.getSystem2Status(sys2);
    const measurements: number[] = [];
    const start = Date.now();
    let startCorruption = status.corruption;
    for (let i = 10; i < 100; i += 10) {
        setTimeout(() => {
            measurements.push((status.corruption - startCorruption) / (Date.now() - start));
        }, i);
    }
    await new Promise(res => setTimeout(res, 110));

    return measurements.reduce((avg, curr) => {
        expect(curr).to.be.approximately(avg, avg * 0.01);
        return avg;
    })
}

/**
 * match floating point number up to 0.1% deviation
 */
function approx(val: number) {
    return match(
        (v: any) => {
            return (v < val * 1.001) && (v > val * 0.999);
        }, `approx. ${val.toFixed(2)}`);
}

