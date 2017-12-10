import config from './test-kit/config';
import {eeTestServerLifecycle} from "./test-kit/empty-epsylon-server-manager";
import {DEFAULT_OPTIONS, Options, SimulatorServices} from "../src/index";
import {MemoryFileSystem} from "kissfs";
import {FILE_PATH} from "../src/osc-bridge/game-monitor";
import {MetaArgument, OscMessage, UDPPort} from "osc";
import {HttpDriver} from "../src/empty-epsilon/driver";
import {expect} from 'chai';
import {retry} from "./test-kit/retry";
import {ESystem} from "../src/empty-epsilon/model";
import {InfraSystem} from "../src/repair-module/logic";
import {System1} from "../src/repair-module/systems";

const udpHosts = {localAddress: '127.0.0.1', remoteAddress: '127.0.0.1'};
const options: Options = {
    ...DEFAULT_OPTIONS,
    eeAddress: config.serverAddress,
    oscOptions: {
        ...DEFAULT_OPTIONS.oscOptions,
        ...udpHosts
    }
};

describe('e2e', () => {
    describe('SimulatorServices', () => {

        eeTestServerLifecycle(config);

        let services: SimulatorServices;
        let oscClient: UDPPort;
        let eeDriver: HttpDriver;


        before('init test clients', async () => {
            eeDriver = new HttpDriver(options.eeAddress);

            oscClient = new UDPPort({
                localAddress: options.oscOptions.remoteAddress,
                localPort: options.oscOptions.remotePort,
                remoteAddress: options.oscOptions.localAddress,
                remotePort: options.oscOptions.localPort,
                metadata: true
            });
            oscClient.open();
        });

        beforeEach('init services', async () => {
            const fs = new MemoryFileSystem();
            const monitorAddresses: string[] = ['/ee/player-ship/-1/hull'];
            fs.saveFileSync(FILE_PATH, JSON.stringify(monitorAddresses));
            services = new SimulatorServices(options, fs);
            await services.init();
        });

        after('destroy test clients', () => {
            oscClient.close();
        });
        afterEach('destroy services', () => {
            services.close();
        });

        function getOscValue(address: string) {
            const client = oscClient;
            return new Promise(res => {
                function listener(message: OscMessage) {
                    if (message.address === address) {
                        client.removeListener('message', listener);
                        res((message.args as Array<MetaArgument>)[0].value);
                    }
                }

                client.addListener('message', listener);
            });
        }

        function setOscValue(address: string, value: number) {
            oscClient.send({address, args: [{type: 'f', value}]});
        }

        describe('ee-osc bridge', () => {
            it(`read value from ee via osc`, async () => {
                let hull = await getOscValue('/ee/player-ship/-1/hull');
                expect(hull).to.eql(250);
            });

            it(`change value in ee via osc`, async () => {
                setOscValue('/ee/player-ship/-1/hull', 123);
                await retry(async () => {
                    let hull = await getOscValue('/ee/player-ship/-1/hull');
                    expect(hull).to.eql(123);
                }, {interval: 20, timeout: 1000});
            });

            it(`listen to game value change via osc`, async () => {
                await eeDriver.command('getPlayerShip(-1):setHull({0})', ['123'])
                await retry(async () => {
                    let hull = await getOscValue('/ee/player-ship/-1/hull');
                    expect(hull).to.eql(123);
                }, {interval: 20, timeout: 1000});
            });
        });

        xdescribe('repair module', () => {
            for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
                it(`read ${ESystem[s1]} via osc`, () => {
                    return Promise.all([(async () => {
                        let repairRate = await getOscValue(`/d/repairs/${ESystem[s1]}/repair-rate`);
                        expect(repairRate).to.eql(System1.repairRate);
                    })(), (async () => {
                        let heatRate = await getOscValue(`/d/repairs/${ESystem[s1]}/heat-rate`);
                        expect(heatRate).to.eql(0);
                    })(), (async () => {
                        let maxPower = await getOscValue(`/d/repairs/${ESystem[s1]}/max-power`);
                        expect(maxPower).to.eql(0);
                    })()]);
                });
            }

            for (let s2 = 0; s2 < InfraSystem.COUNT; s2++) {
                it(`read ${InfraSystem[s2]} via osc`, async () => {
                    return Promise.all([(async () => {
                        let isErr = await getOscValue(`/d/repairs/${InfraSystem[s2]}/is-error`);
                        expect(isErr).to.eql(0);
                    })(), (async () => {
                        let isOnline = await getOscValue(`/d/repairs/${InfraSystem[s2]}/is-online`);
                        expect(isOnline).to.eql(0);
                    })(), (async () => {
                        let overload = await getOscValue(`/d/repairs/${InfraSystem[s2]}/overload`);
                        expect(overload).to.eql(0);
                    })()]);
                });
                it(`start up / error / shut down ${InfraSystem[s2]} via osc`, async () => {
                    oscClient.send({address: `/d/repairs/${InfraSystem[s2]}/start-up`, args: []});
                 //   await new Promise(res => setTimeout(res, 250));
                    let isOnline = await getOscValue(`/d/repairs/${InfraSystem[s2]}/is-online`);
                    expect(isOnline).to.eql(1);
                    oscClient.send({address: `/d/repairs/${InfraSystem[s2]}/error`, args: []});
                //    await new Promise(res => setTimeout(res, 250));
                    isOnline = await getOscValue(`/d/repairs/${InfraSystem[s2]}/is-error`);
                    expect(isOnline).to.eql(1);
                    oscClient.send({address: `/d/repairs/${InfraSystem[s2]}/shut-down`, args: []});
                 //   await new Promise(res => setTimeout(res, 250));
                    Promise.all([(async () => {
                        isOnline = await getOscValue(`/d/repairs/${InfraSystem[s2]}/is-online`);
                        expect(isOnline).to.eql(0);
                    })(), (async () => {
                        isOnline = await getOscValue(`/d/repairs/${InfraSystem[s2]}/is-error`);
                        expect(isOnline).to.eql(0);
                    })()]);
                });
            }
        });
    });
});
