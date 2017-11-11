import {
    EnumType,
    isPrimitiveOrArrayOfPrimitiveType,
    PrimitiveType,
    ProcessedResource,
    ProcessedType,
    processGeneratedSchema
} from "./process-schema";
import generatedSchema from "./generated-schema";
import {Argument, MetaArgument, OscMessage} from "osc";
import naming = require('naming');
import {ESystem} from "../empty-epsilon/model";

export interface GameQuery {
    address: string;
    expr: string;
    type: string;
}

export interface GameCommand {
    template: string;
    values: Array<string>;
}

const processedGameSchema = processGeneratedSchema(generatedSchema);

function translatePrimitiveType(pt: PrimitiveType): 'f' | 'i' {
    return pt.charAt(0) as any;
}

function translateType(pt: PrimitiveType | Array<PrimitiveType>): string {
    return pt instanceof Array ? pt.map(translatePrimitiveType).join('') : translatePrimitiveType(pt);
}

function isMetaArgument(arg: Argument | MetaArgument): arg is MetaArgument {
    return typeof arg === 'object';
}

function addressItemToArgument(addressItem: string, argumentSchema: PrimitiveType | EnumType){
    switch(argumentSchema){
        case "float" :
            return Number.parseFloat(addressItem).toFixed(2);
        case "integer" :
            return addressItem;
        case "ESystem":
            const name = naming(addressItem, 'pascal');
            let f = ESystem as any;
            if (typeof f[name] === 'undefined'){
                throw new Error(`bad ESystem name ${name}`);
            }
            return '"'+name+'"';
        default:
            throw new Error(`unknown type: ${argumentSchema}`);
    }
}

function addressArrToArguments(addressParts : Array<string>, argumentsSchema: Array<PrimitiveType | EnumType>){
    return argumentsSchema.map((t, i)=> addressItemToArgument(addressParts[i], t))
}

// export function translateOscMessageToGameCommand(address: string, oscArgs: Array<MetaArgument> | Array<Argument>): GameCommand {
export function translateOscMessageToGameCommand(message: OscMessage): GameCommand {
    const addressArr = message.address.split('/');
    const oscArgs: Array<any> = message.args instanceof Array ? message.args : [message.args];
    const vals = addressArr.concat(oscArgs.map<string>(arg => '' + (arg.value == undefined ? arg : arg.value)));
  //  console.info(`handling command: ${vals.join('/')}`);

    // assert address begins with '/ee/'
    if (addressArr[0] !== '' || addressArr[1] !== 'ee') {
        throw new Error(`ilegal address prefix ${ message.address}`);
    }

    let addrIdx = 2;
    let path: string[] = [];
    let currentType: ProcessedType = processedGameSchema.global;

    while (addrIdx < addressArr.length) {
        if (isPrimitiveOrArrayOfPrimitiveType(currentType)) {
            throw new Error(`reached a primitive result ${currentType} before address is finished ${message.address}`);
        } else {
            const symbolName = addressArr[addrIdx++];
            const symbol: ProcessedResource = currentType[symbolName];
            if (symbol) {
                // the +1 makes us not use getters that exhaust the entire address. the last part needs to be a setter.
                if (symbol && symbol.get && addrIdx < addressArr.length - symbol.get.arguments.length) {
                    currentType = symbol.get.type;
                    const lastArdIdx = addrIdx + symbol.get.arguments.length;
                    path.push(`${symbol.get.methodName}(${addressArrToArguments(addressArr.slice(addrIdx, lastArdIdx), symbol.get.arguments).join(',')})`);
                    addrIdx = lastArdIdx;
                } else if (symbol && symbol.set && addrIdx <= vals.length - symbol.set.arguments.length) { // last one is a setter, its arguments are taken from the vals array
                    const lastArdIdx = addrIdx + symbol.set.arguments.length;
                    path.push(symbol.set.methodName);
                    const setter = path.join(':');
                    const values = addressArrToArguments(vals.slice(addrIdx, lastArdIdx), symbol.set.arguments);
                    const numOfStaticValues =  addressArr.length - addrIdx;
                    return {
                        template: `${setter}(${values.map((v, idx) => idx >= numOfStaticValues? `{${idx}}` : v).join(', ')})`,
                        values: values
                    }
                } else {
                    throw new Error(`reached a symbol with no matching methods '${symbolName}' in ${vals}`);
                }
            } else {
                throw new Error(`reached an unknown symbol '${symbolName}' in ${message.address}`);
            }
        }
    }
    throw new Error(`reached a non-primitive result ${currentType} but address is finished ${message.address}`);
}


export function translateAddressToGameQuery(address: string): GameQuery {
    const addressArr = address.split('/');

    // assert address begins with '/ee/'
    if (addressArr[0] !== '' || addressArr[1] !== 'ee') {
        throw new Error(`ilegal address prefix ${ address}`);
    }

    let addrIdx = 2;
    let path: string[] = [];
    let currentType: ProcessedType = processedGameSchema.global;

    while (addrIdx < addressArr.length) {
        if (isPrimitiveOrArrayOfPrimitiveType(currentType)) {
            throw new Error(`reached a primitive result ${currentType} before address is finished ${address}`);
        } else {
            const symbolName = addressArr[addrIdx++];
            const symbol: ProcessedResource = currentType[symbolName];
            if (symbol && symbol.get && addrIdx <= addressArr.length - symbol.get.arguments.length) {
                currentType = symbol.get.type;
                const lastArdIdx = addrIdx + symbol.get.arguments.length;
                path.push(`${symbol.get.methodName}(${addressArrToArguments(addressArr.slice(addrIdx, lastArdIdx), symbol.get.arguments).join(',')})`);
                addrIdx = lastArdIdx;
            } else {
                throw new Error(`reached an unknown symbol '${symbolName}' in ${address}`);
            }
        }
    }
    if (isPrimitiveOrArrayOfPrimitiveType(currentType)) {
        return {
            address: address,
            expr: path.join(':'),
            type: translateType(currentType)
        }
    } else {
        throw new Error(`reached a non-primitive result ${currentType} but address is finished ${address}`);
    }
}
