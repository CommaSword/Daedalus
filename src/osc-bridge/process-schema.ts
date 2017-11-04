import naming = require('naming');

export type PrimitiveType = 'float' | 'integer';

export interface GeneratedSchema {
    [k: string]: GameContext<this>;
}

type GameContextName<S extends GeneratedSchema> = keyof S;

type GameValueType<S extends GeneratedSchema> = GameContextName<S> | PrimitiveType;

type GameMethod<S extends GeneratedSchema> = {
    arguments: number,
    type: GameValueType<S>
};

type GameContext<S extends GeneratedSchema> = {
    [k: string]: GameContextName<S> | GameMethod<S>;
}

export type ProcessedSchema = { [k: string]: ProcessedContext };

export type ProcessedType = ProcessedContext | PrimitiveType;

export type ProcessedReadMethod = {
    methodName: string,
    arguments: number,
    type: ProcessedType
}

export type ProcessedResource = {
    read: ProcessedReadMethod,
}
export type ProcessedContext = {

    [k: string]: ProcessedResource;
}


export function isPrimitiveType(t: any): t is PrimitiveType {
    return t === 'float' || t === 'integer';
}

function isGameMethod(t: any): t is GameMethod<any> {
    return typeof t === 'object' && t && t.arguments !== undefined && typeof t.type === 'string';
}

function initContextNode<S extends GeneratedSchema>(ctxName: keyof S, generatedGameSchema: S, processedGameSchema: ProcessedSchema) {
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

export function processGeneratedSchema<S extends GeneratedSchema>(generatedGameSchema: GeneratedSchema): ProcessedSchema {
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
                const type: ProcessedType = (isPrimitiveType(generatedMethodMeta.type)) ? generatedMethodMeta.type : processedGameSchema[generatedMethodMeta.type];
                const processedMethod: ProcessedReadMethod = {
                    methodName: methodName,
                    arguments: generatedMethodMeta.arguments,
                    type: type,
                };
                methodContext[naming.disperse(methodName).slice(1).join('-')] = {read: processedMethod};
            }
        }
    }
    return processedGameSchema;
}

