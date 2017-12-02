import {RepairLogic} from "../../src/repair-module/logic";
import {System2Status} from "../../src/repair-module/systems";
import {expect} from 'chai';
import {match} from "sinon";


type Options = {
    iterations : number,
    graceFactor : number,
    tickInterval : number,
}

export async function getLinearDeriviation(sample: ()=>Promise<number>, {iterations, graceFactor, tickInterval}: Options) {
    const sampleInterval = tickInterval * 2 / graceFactor;
    const measurements: number[] = [];
    let startValue = await sample();
    const start = Date.now();
    for (let i = sampleInterval; i < sampleInterval * iterations; i += sampleInterval) {
        setTimeout(async () => {
            measurements.push((await sample() - startValue) / (Date.now() - start));
        }, i);
    }
    await new Promise(res => setTimeout(res, sampleInterval * (iterations + 1)));
    // assert the deriviation is linear and average it
    return measurements.reduce((avg, curr, i) => {
        expect(curr).to.be.approximately(avg, avg * graceFactor);
        return (i * avg + curr) / (i + 1);
    });
}

export async function getLinearCorruptionDeriviation(status: System2Status, graceFactor : number) {
    return await getLinearDeriviation(async () => status.corruption, {iterations:3, graceFactor, tickInterval: RepairLogic.tickInterval});
}

/**
 * match floating point number up to 0.1% deviation
 */
export function approx(val: number) {
    return match((v: any) => (v < val * 1.001) && (v > val * 0.999), `approx. ${val.toFixed(2)}`);
}


