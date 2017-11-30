import {RepairModule} from "../../src/repair-module/repair";
import {System2Status} from "../../src/repair-module/systems";
import {expect} from 'chai';
import {match} from "sinon";

const iterations = 3;
export const graceFactor = 0.1;
const sampleInterval = RepairModule.tickInterval * 2 / graceFactor;
export const timePerTest = iterations * sampleInterval;

export async function getLinearCorruptionDeriviation(status: System2Status) {
    const measurements: number[] = [];
    const start = Date.now();
    let startCorruption = status.corruption;
    for (let i = sampleInterval; i < sampleInterval * iterations; i += sampleInterval) {
        setTimeout(() => {
            measurements.push((status.corruption - startCorruption) / (Date.now() - start));
        }, i);
    }
    await new Promise(res => setTimeout(res, sampleInterval * (iterations + 1)));
    // assert the deriviation is livear and average it
    return measurements.reduce((avg, curr, i) => {
        expect(curr).to.be.approximately(avg, avg * graceFactor);
        return (i * avg + curr) / (i + 1);
    });
}

/**
 * match floating point number up to 0.1% deviation
 */
export function approx(val: number) {
    return match((v: any) => (v < val * 1.001) && (v > val * 0.999), `approx. ${val.toFixed(2)}`);
}


