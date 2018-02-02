import {expect} from 'chai';
import {EcrLogic} from "../../src/ecr/logic";
import {ESystem} from "empty-epsilon-js";
import {match, spy} from 'sinon';
import {EcrModel, ESwitchBoard, PrimarySystem, SwitchBoard, SwitchBoardStatus} from "../../src/ecr/model";
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

    let repair: EcrLogic;

    beforeEach('init module', () => {
        repair = new EcrLogic(sideEffects, new EcrModel());
        repair.init();
        for (let s2 = 0; s2 < ESwitchBoard.COUNT; s2++) {
            repair.startupSwitchBoard(s2);
        }
    });

    afterEach(`reset sideEffects`, () => {
        repair.destroy();
        sideEffects.setRepairRate.reset();
        sideEffects.setHeatRate.reset();
        sideEffects.setMaxPower.reset();
    });

    it('exposes all the systems', () => {
        for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
            expect(repair.getPrimarySystemStatus(s1).id).to.eql(s1);
        }
        for (let s2 = 0; s2 < ESwitchBoard.COUNT; s2++) {
            expect(repair.getSwitchBoardStatus(s2).id).to.eql(s2);
        }
    });

    it('.startRepairingPrimarySystem(x), .stopRepairingPrimarySystem() affect side effects repair rate and the value of .repairing', () => {
        repair.startRepairingPrimarySystem(ESystem.JumpDrive);
        expect(sideEffects.setRepairRate).to.have.been.calledWith(ESystem.JumpDrive, approx(repair.getPrimarySystemStatus(ESystem.JumpDrive).repairRate));
        expect(repair.repairing).to.eql(ESystem.JumpDrive);
        repair.stopRepairingPrimarySystem();
        expect(sideEffects.setRepairRate).to.have.been.calledWith(ESystem.JumpDrive, 0);
        expect(repair.repairing).to.eql(null);
    });

    it('requires to stop repairing a system before repairing another one', () => {
        repair.startRepairingPrimarySystem(ESystem.JumpDrive);
        expect(() => repair.startRepairingPrimarySystem(ESystem.RearShield)).to.throw(Error);
    });

    it('does not throw on repair command for currently repairing system', () => {
        repair.startRepairingPrimarySystem(ESystem.JumpDrive);
        expect(() => repair.startRepairingPrimarySystem(ESystem.JumpDrive)).not.to.throw(Error);
    });

    it('A system1 can only be over-powered (more than 100% energy) when all of its supporting system2s are online', () => {
        expect(sideEffects.setMaxPower).to.have.been.calledWith(ESystem.Impulse, PrimarySystem.maxOverPower);
        sideEffects.setMaxPower.reset();
        repair.shutdownSwitchBoard(ESwitchBoard.A2);
        const dependant = EcrModel.switchboardstMap[ESwitchBoard.A2][0];
        expect(sideEffects.setMaxPower).to.have.been.calledWith(dependant, match.number.and(match((n: number) => n <= PrimarySystem.maxSupportedPower)));
        expect(sideEffects.setMaxPower).to.have.not.been.calledWith(dependant, PrimarySystem.maxOverPower);
    });

    it('When a supporting system2 is offline, the maximum level of a system1’s power will decrease', () => {
        const dependant = EcrModel.switchboardstMap[ESwitchBoard.A2][0];
        const dependantStatus = repair.getPrimarySystemStatus(dependant);
        expect(dependantStatus.maxPower).to.equal(PrimarySystem.maxOverPower);

        sideEffects.setMaxPower.reset();
        repair.shutdownSwitchBoard(ESwitchBoard.A2);
        expect(dependantStatus.maxPower).to.be.lessThan(PrimarySystem.maxSupportedPower);
        expect(sideEffects.setMaxPower).to.have.been.calledWith(dependant, approx(dependantStatus.maxPower));
    });

    describe('When a system1 is over-powered', () => {
        let activeCollectorStatus: SwitchBoardStatus;
        const dependant = EcrModel.switchboardstMap[ESwitchBoard.A2][0];

        beforeEach(() => {
            activeCollectorStatus = repair.getSwitchBoardStatus(ESwitchBoard.A2);
        });

        it('its supporting system2s accumulate overload', async () => {
            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor)).to.eql(0);
            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower * 2});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor)).to.be.gt(0);
        }).timeout(10 * 1000);

        it('The overload rate is linear to the level of extra energy', async () => {
            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower * 2});
            const overPower100Percent = await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor);
            expect(overPower100Percent).to.be.greaterThan(0);

            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower * 1.5});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '1.5 power').to.be.approximately(overPower100Percent * 0.5, overPower100Percent * graceFactor);
            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower * 2});
            await Promise.resolve();
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '2 power').to.be.approximately(overPower100Percent, overPower100Percent * graceFactor);
            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower * 2.5});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '2.5 power').to.be.approximately(overPower100Percent * 1.5, overPower100Percent * graceFactor);
            sideEffects.powerInput.next({system: dependant, power: PrimarySystem.maxSupportedPower * 3});
            expect(await getLinearOverloadDeriviation(activeCollectorStatus, graceFactor), '3 power').to.be.approximately(overPower100Percent * 2, overPower100Percent * graceFactor);
        }).timeout(20 * 1000);
    });

    it('When a system2’s overload level reaches its overload threshold, it goes into error state', () => {
        const system2 = repair.getSwitchBoardStatus(ESwitchBoard.B2) as SwitchBoard;
        expect(system2.isError).to.eql(false);
        repair.addOverloadToSwitchBoard(ESwitchBoard.B2, system2.overloadErrorThreshold);
        expect(system2.isError).to.eql(false);
        repair.addOverloadToSwitchBoard(ESwitchBoard.B2, 0.00001);
        expect(system2.isError).to.eql(true);
    });

    describe('When one or more supporting system2 is in error state', () => {
        const dependant = EcrModel.switchboardstMap[ESwitchBoard.A2][0];

        it('the supported system1 begins accumulating heat (the rate does not change according to the amount of systems in error)', () => {
            repair.setError(ESwitchBoard.A2);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(dependant, approx(PrimarySystem.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.setError(ESwitchBoard.A3);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(dependant, approx(PrimarySystem.heatOnErrorRate));
            sideEffects.setRepairRate.reset();
            repair.shutdownSwitchBoard(ESwitchBoard.A2);
            repair.shutdownSwitchBoard(ESwitchBoard.A3);
            expect(sideEffects.setHeatRate).to.have.been.calledWith(dependant, 0);
        });

        it('the repair rate of supported system1 is lower than the normal rate', () => {
            const depRepairRate = repair.getPrimarySystemStatus(dependant).repairRate;
            repair.startRepairingPrimarySystem(dependant);
            repair.setError(ESwitchBoard.A2);
            expect(repair.getPrimarySystemStatus(dependant).repairRate).to.be.lessThan(depRepairRate);
            expect(sideEffects.setRepairRate).to.have.been.calledWith(dependant, approx(repair.getPrimarySystemStatus(dependant).repairRate));
        });
    });
});
