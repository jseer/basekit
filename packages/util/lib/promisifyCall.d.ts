declare function promisifyCall<T extends Function>(fn: T, arg: any[], context?: any): Promise<unknown>;
export default promisifyCall;
