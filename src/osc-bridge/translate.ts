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

export function translateAddressToGameQuery(address: string): GameQuery | null {
    const vals = address.split('/');

    // assert address begins with '/ee/'
    if (vals[0] !== '' || vals[1] !== 'ee') {
        console.error(`ilegal address prefix`, address);

        return null;
    }

    let i = 2;
    let commands: string[] = [];
    let currentType: ProcessedType = processedGameSchema.global;

    while (i < vals.length) {
        if (isPrimitiveType(currentType)) {
            console.error(`reached a primitive result ${currentType} before address is finished`, address);
            return null;
        } else {
            const symbolName = vals[i];
            const symbol: ProcessedResource = currentType[symbolName];
            if (symbol) {
                currentType = symbol.read.type;
                const lastArdIdx = i + symbol.read.arguments + 1;
                commands.push(`${symbol.read.methodName}(${vals.slice(i + 1, lastArdIdx).join(',')})`);
                i = lastArdIdx;
            } else {
                return null;
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
        console.error(`reached a non-primitive result ${currentType} but address is finished`, address);
        return null;
    }
}
