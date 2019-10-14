import {EEDriverWithHooks, ESystem} from "empty-epsilon-js";
import {EcrDriver} from "./driver";
import {EcrLogic, lowercaseInfraSystemNames} from "./logic";
import {OscDriver} from "open-epsilon";
import {MetaArgument, OscMessage} from "osc";
import {Observable, Subscription, interval} from "rxjs";
import { switchMap } from 'rxjs/operators';
import {EcrModel, EcrState, ESwitchBoard} from "./model";
import {Persistence} from "../core/persistency";
import {HttpCommandsDriver} from "../core/http-commands";

export class EcrModule {
    private subscription: Subscription;
    private readonly logic: EcrLogic;
    private readonly driver: EcrDriver;
    private pulse: Observable<any> = interval(1111);
    private model: EcrModel;

    constructor(eeDriver: EEDriverWithHooks, private oscDriver: OscDriver, private httpCommandsDriver: HttpCommandsDriver, private persistence : Persistence<EcrState>) {
        this.driver = new EcrDriver(eeDriver, this.pulse);
        this.model = new EcrModel();
        this.logic = new EcrLogic(this.driver, this.model);
    }

    async init() {
        this.persistence.init(this.model);
        this.oscDriver.inbox.filter(m => m.address.startsWith('/d/repairs')).subscribe(message => {
            // console.log(message);
            const addressArr = message.address.split('/');
            if (addressArr.length === 5) {
                const command = addressArr[4];
                const systemName = addressArr[3].toLowerCase();
                const s2 = lowercaseInfraSystemNames.indexOf(systemName);
                if (~s2) {
                    //   console.log('*********MSG:', message.address);
                    switch (command) {
                        case 'fix-everything':
                            this.logic.fixEverything(s2);
                            break;
                        case 'complex-error':
                            this.logic.setHardError(s2);
                            break;
                        case 'start-up':
                            this.logic.startupSwitchBoard(s2);
                            break;
                        case 'shut-down':
                            this.logic.shutdownSwitchBoard(s2);
                            break;
                        case 'overload-threshold':
                            const overloadThreshold = (message.args as [MetaArgument])[0].value as number;
                            this.logic.setOverloadThreshold(s2, overloadThreshold);
                            break;
                        case 'load':
                            const overload = (message.args as [MetaArgument])[0].value as number;
                            this.logic.setOverload(s2, overload);
                            break;
                        default:
                            console.error('unknown command', command);
                    }
                } else {
                    console.error('unknown system', systemName);
                }
            } else {
                console.error('maleformed address', message.address);
            }
        });
        this.httpCommandsDriver.observable.subscribe(e => {
            for (const switchIdStr in ESwitchBoard) {
                const switchId = Number(switchIdStr);
                if (!isNaN(switchId) && e.url.pathname == '/fixeverything/' + ESwitchBoard[switchId]) {
                    this.logic.fixEverything(switchId);
                    e.accept(JSON.stringify(this.model.switchBoards[switchId].toJSON(), null, 2));
                    return;
                }
            }
        });
        this.broadcastSystemsState();
        await this.driver.init();
        await this.logic.init();
    }

    private broadcastSystemsState() {
        this.subscription = this.pulse.pipe(switchMap<any, OscMessage[]>(_ => {
            const result: OscMessage[] = [];
            /*
            for (let s1 = 0; s1 < ESystem.COUNT; s1++) {
                const system1 = this.logic.getPrimarySystemStatus(s1);
                result.push({
                    address: `/d/repairs/${ESystem[s1]}/repair-rate`,
                    args: {type: 'f', value: system1.repairRate}
                }, {
                    address: `/d/repairs/${ESystem[s1]}/heat-rate`,
                    args: {type: 'f', value: system1.heatRate}
                }, {
                    address: `/d/repairs/${ESystem[s1]}/max-power`,
                    args: {type: 'f', value: system1.maxPower}
                });
            }
            */
            for (let s2 = 0; s2 < ESwitchBoard.COUNT; s2++) {
                const system2 = this.logic.getSwitchBoardStatus(s2);
                result.push({
                    address: `/d/repairs/${ESwitchBoard[s2]}/is-error`,
                    args: {type: 'i', value: system2.isError ? 1 : 0}
                }, {
                    address: `/d/repairs/${ESwitchBoard[s2]}/is-online`,
                    args: {type: 'i', value: system2.isOnline ? 1 : 0}
                }, {
                    address: `/d/repairs/${ESwitchBoard[s2]}/load`,
                    args: {type: 'f', value: system2.overload}
                }, {
                    address: `/d/repairs/${ESwitchBoard[s2]}/overload-threshold`,
                    args: {type: 'f', value: system2.overloadErrorThreshold}
                });
            }
            return result;
        })).subscribe(this.oscDriver.outbox);
    }
    
    beginRepair(id: ESystem) {
        this.logic.startRepairingPrimarySystem(id);
    }

    stopRepair() {
        this.logic.stopRepairingPrimarySystem();
    }

    destroy() {
        this.subscription.unsubscribe();
        this.logic.destroy();
    }
}
