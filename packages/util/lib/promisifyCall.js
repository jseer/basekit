"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function promisifyCall(fn, arg, context) {
    return new Promise((resolve, reject) => {
        fn.call(context, ...arg, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
exports.default = promisifyCall;
