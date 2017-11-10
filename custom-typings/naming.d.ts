declare module "naming" {


    function naming(str: string, type: 'camel' | 'pascal' | 'snake' | 'kebab' | 'caps'): string;

    namespace naming {
        function disperse(str: string): string[];
    }
    export = naming;
}
