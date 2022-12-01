"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@zjseer/util");
const qiniu_1 = __importDefault(require("qiniu"));
const urllib_1 = require("urllib");
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Oss {
    constructor(opts) {
        this.uploadTokenDeferred = (0, util_1.deferred)();
        this.includeDirs = opts.includeDirs || [process.cwd()];
        this.excludeKey = opts.excludeKey;
        this.getUploadTokenUrl = opts.getUploadTokenUrl;
        if (opts.uploadToken) {
            this.uploadToken = opts.uploadToken;
            this.uploadTokenDeferred.resolve();
        }
        else if (opts.getUploadTokenUrl) {
            this.uploadToken = '';
            this.getUploadToken();
        }
        else {
            throw new Error('[oss] uploadToken must direct specify uploadToken or provide getUploadTokenUrl');
        }
    }
    get _putStreamDefault() {
        return {
            zone: qiniu_1.default.zone.Zone_z2,
        };
    }
    getUploadToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield (0, urllib_1.request)(this.getUploadTokenUrl, {
                    dataType: 'json',
                });
                if (data && data.code === 200) {
                    this.uploadToken = data.data.uploadToken;
                    this.uploadTokenDeferred.resolve();
                }
                else {
                    throw new Error(`data: ${data}`);
                }
            }
            catch (e) {
                this.uploadTokenDeferred.reject(new Error('[oss getUploadToken] ' + e));
            }
        });
    }
    getUploadTokenTimeout() {
        return (0, util_1.timeout)({
            err: new Error('[oss getUploadToken] timeout'),
            delay: 5000,
        });
    }
    getFormUploader(conf) {
        const config = new qiniu_1.default.conf.Config();
        Object.assign(config, conf);
        const formUploader = new qiniu_1.default.form_up.FormUploader(config);
        return formUploader;
    }
    createEmptyResultByDir(dir) {
        return {
            dir,
            allCount: 0,
            success: [],
            successCount: 0,
            failCount: 0,
            fail: [],
        };
    }
    putStream(uploadPath, parent, formUploader, putExtra, result) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentPath = path_1.default.join(uploadPath, parent);
            let files = yield promises_1.default.readdir(parentPath);
            const fileStats = files
                .filter((file) => this.excludeKey
                ? this.excludeKey.test(parent ? `${parent}/${file}` : file)
                : true)
                .map((file) => {
                const _path = path_1.default.join(parentPath, file);
                return {
                    path: _path,
                    key: parent ? `${parent}/${file}` : file,
                    stat: promises_1.default.stat(_path),
                };
            });
            const curFileUploads = [];
            const curDirectoryUploads = [];
            for (let fileStat of fileStats) {
                const stat = yield fileStat.stat;
                if (stat.isDirectory()) {
                    curDirectoryUploads.push(this.putStream(uploadPath, fileStat.key, formUploader, putExtra, result));
                }
                else {
                    const readableStream = fs_1.default.createReadStream(fileStat.path);
                    curFileUploads.push(new Promise((resolve, reject) => {
                        formUploader.putStream(this.uploadToken, fileStat.key, readableStream, putExtra, function (respErr, respBody, respInfo) {
                            result.allCount++;
                            if (respErr) {
                                result.fail.push({ key: fileStat.key, error: respErr });
                                result.failCount++;
                                return reject(respErr);
                            }
                            if (respInfo.statusCode == 200) {
                                result.success.push({ key: fileStat.key, body: respBody });
                                result.successCount++;
                                resolve();
                            }
                            else {
                                result.fail.push({ key: fileStat.key, statusCode: respInfo.statusCode, body: respErr });
                                result.failCount++;
                                reject({
                                    statusCode: respInfo.statusCode,
                                    respBody,
                                });
                            }
                        });
                    }));
                }
            }
            yield Promise.allSettled(curFileUploads.concat(curDirectoryUploads));
        });
    }
    uploadByStream(conf) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[oss] uploadByStream start ...');
            yield Promise.race([
                this.uploadTokenDeferred.promise,
                this.getUploadTokenTimeout(),
            ]);
            const formUploader = this.getFormUploader(Object.assign({}, this._putStreamDefault, conf));
            const putExtra = new qiniu_1.default.form_up.PutExtra();
            const result = this.includeDirs.map(this.createEmptyResultByDir);
            yield Promise.allSettled(this.includeDirs.map((uploadPath, i) => this.putStream(uploadPath, '', formUploader, putExtra, result[i])));
            console.log('[oss] uploadByStream end => result: ', result);
        });
    }
}
exports.default = Oss;
//# sourceMappingURL=qiniu-oss.js.map