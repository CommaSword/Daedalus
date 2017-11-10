import {
    isPrimitiveType,
    PrimitiveType,
    ProcessedResource,
    ProcessedType,
    processGeneratedSchema
} from "./process-schema";
import generatedSchema from "./generated-schema";

export interface GameQuery {
    address: string;
    expr: string;
    type: 'f' | 'i';
}

const processedGameSchema = processGeneratedSchema(generatedSchema);

function translateType(pt: PrimitiveType): 'f' | 'i' {
    return pt.charAt(0) as any;
}

export function translateAddressToGameQuery(address: string): GameQuery {
    const vals = address.split('/');

    // assert address begins with '/ee/'
    if (vals[0] !== '' || vals[1] !== 'ee') {
        throw new Error(`ilegal address prefix ${ address}`);
    }

    let i = 2;
    let commands: string[] = [];
    let currentType: ProcessedType = processedGameSchema.global;

    while (i < vals.length) {
        if (isPrimitiveType(currentType)) {
            throw new Error(`reached a primitive result ${currentType} before address is finished ${address}`);
        } else {
            const symbolName = vals[i];
            const symbol: ProcessedResource = currentType[symbolName];
            if (symbol) {
                currentType = symbol.read.type;
                const lastArdIdx = i + symbol.read.arguments + 1;
                commands.push(`${symbol.read.methodName}(${vals.slice(i + 1, lastArdIdx).join(',')})`);
                i = lastArdIdx;
            } else {
                throw new Error(`reached an unknown symbol '${symbolName}' in ${address}`);
            }
        }
    }
    if (isPrimitiveType(currentType)) {
        return {
            address: address,
            expr: commands.join(':'),
            type: translateType(currentType)
        }
    } else {
        throw new Error(`reached a non-primitive result ${currentType} but address is finished ${address}`);
    }
}
