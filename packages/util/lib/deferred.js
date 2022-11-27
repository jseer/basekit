"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deferred = () => {
    const def = {};
    def.promise = new Promise((resolve, reject) => {
        def.resolve = resolve;
        def.reject = reject;
    });
    return def;
};
exports.default = deferred;
