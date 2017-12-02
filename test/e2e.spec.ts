import config from './test-kit/config';
import {eeTestServerLifecycle} from "./test-kit/empty-epsylon-server-manager";
import {DEFAULT_OPTIONS, Options, SimulatorServices} from "../src/index";
import {MemoryFileSystem} from "kissfs";
import {FILE_PATH} from "../src/osc-bridge/game-monitor";
import {MetaArgument, OscMessage, UDPPort} from "osc";
import {HttpDriver} from "../src/empty-epsilon/driver";
import {expect} from 'chai';
import {retry} from "./test-kit/retry";

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

    });
});
