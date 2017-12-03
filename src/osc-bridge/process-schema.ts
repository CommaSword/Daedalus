import naming = require('naming');

export type PrimitiveType = 'float' | 'integer' | 'bool';

export type EnumType = "ESystem" | "EMissileWeapons";

export interface GameSchema {
    [k: string]: GameContext<this>;
}

export type GameContextName<S extends GameSchema> = keyof S;

export type GameValueType<S extends GameSchema> = [GameContextName<S>] | Array<PrimitiveType>;

export type GameMethod<S extends GameSchema> = {
    arguments: Array<PrimitiveType | EnumType>,
    type: GameValueType<S>
};

export type GameContext<S extends GameSchema> = {
    [k: string]: GameContextName<S> | GameMethod<S>;
}

export type ProcessedSchema = { [k: string]: ProcessedContext };

export type ProcessedType = ProcessedContext | Array<PrimitiveType>;

export type ProcessedGetMethod = {
    methodName: string,
    arguments: Array<PrimitiveType | EnumType>,
    type: ProcessedType
}

export type ProcessedSetMethod = {
    methodName: string,
    arguments: Array<PrimitiveType | EnumType>,
}

export type ProcessedResource = {
    get?: ProcessedGetMethod,
    set?: ProcessedSetMethod,
}
export type ProcessedContext = {

    [k: string]: ProcessedResource;
}


export function isPrimitiveType(t: any): t is PrimitiveType {
    return t === 'float' || t === 'integer';
}

export function isPrimitiveOrArrayOfPrimitiveType(t: any): t is (PrimitiveType | Array<PrimitiveType>) {
    return t instanceof Array ? t.every(t1 => isPrimitiveType(t1)) : isPrimitiveType(t);
}

function isGameMethod(t: any): t is GameMethod<any> {
    return typeof t === 'object' && t && t.arguments !== undefined && typeof t.type !== 'undefined';
}

function initContextNode<S extends GameSchema>(ctxName: keyof S, generatedGameSchema: S, processedGameSchema: ProcessedSchema) {
    const existingContext = (processedGameSchema as any)[ctxName];
    if (existingContext) {
        return existingContext;
    } else {
        const ctx: GameContext<S> = (generatedGameSchema as any)[ctxName];
        let superCtx = {};
        if (typeof ctx.$inherits === 'string') {
            superCtx = initContextNode(ctx.$inherits as GameContextName<S>, generatedGameSchema, processedGameSchema);
        }
        return processedGameSchema[ctxName] = Object.create(superCtx);
    }
}

export function processApiSchema<S extends GameSchema>(generatedGameSchema: GameSchema): ProcessedSchema {
    const processedGameSchema: ProcessedSchema = {} as any;

    for (let ctxName of Object.keys(generatedGameSchema)) {
        initContextNode(ctxName as GameContextName<S>, generatedGameSchema, processedGameSchema);
    }

    for (let ctxName of Object.keys(generatedGameSchema) as GameContextName<S>[]) {
        const ctx: GameContext<S> = (generatedGameSchema as any)[ctxName];
        const methodContext = processedGameSchema[ctxName];
        for (let methodName of Object.keys(ctx).filter(k => !k.startsWith('$'))) {
            const generatedMethodMeta = ctx[methodName];
            if (isGameMethod(generatedMethodMeta)) {
                const parsedMethodName = naming.disperse(methodName);
                const propertyName = parsedMethodName.slice(1).join('-');
                const methodVerb = parsedMethodName[0].toLowerCase();

                if (methodVerb === 'get') {
                    methodContext[propertyName] = methodContext[propertyName] || {};
                    const type: ProcessedType = (isPrimitiveOrArrayOfPrimitiveType(generatedMethodMeta.type)) ? generatedMethodMeta.type : processedGameSchema[generatedMethodMeta.type[0]];
                    methodContext[propertyName].get = {
                        methodName: methodName,
                        arguments: generatedMethodMeta.arguments,
                        type: type,
                    };
                } else  if (methodVerb === 'set') {
                    methodContext[propertyName] = methodContext[propertyName] || {};
                    methodContext[propertyName].set = {
                        methodName: methodName,
                        arguments: generatedMethodMeta.arguments,
                    };
                }
            }
        }
    }
    return processedGameSchema;
}

