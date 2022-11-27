export interface IDeferred {
    promise: Promise<void>;
    resolve: () => void;
    reject: (reason?: any) => void;
}
declare const deferred: () => IDeferred;
export default deferred;
