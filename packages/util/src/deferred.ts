export interface IDeferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: any) => void;
}

const deferred = () => {
  const def: IDeferred = {} as IDeferred;
  def.promise = new Promise((resolve, reject) => {
    def.resolve = resolve;
    def.reject = reject;
  });
  return def;
};

export default deferred;
