function promisifyCall<T extends Function>(fn: T, arg: any[], context?: any) {
    return new Promise((resolve, reject) => {
        fn.call(context, ...arg, (err: null | Error, result: any) => {
            if(err) {
                return reject(err);
            }
            resolve(result);
        })
    })
}

export default promisifyCall;