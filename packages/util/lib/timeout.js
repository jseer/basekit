"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timeout = ({ delay, err, } = { delay: 5000, err: 'timeout' }) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(err);
        }, delay);
    });
};
exports.default = timeout;
