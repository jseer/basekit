import { deferred, timeout, IDeferred } from '@zjseer/util';
import qiniu from 'qiniu';
import { request } from 'urllib';
import fs from 'fs/promises';
import fs2 from 'fs';
import path from 'path';

interface IOssProps {
  uploadToken?: string;
  getUploadTokenUrl?: string;
  includeDirs?: string[];
  excludeKey?: RegExp;
}

export interface IPutSteamProps {
  zone?: qiniu.conf.Zone;
}
class Oss implements IOssProps {
  private uploadTokenDeferred;
  public uploadToken;
  public includeDirs;
  public excludeKey;
  public getUploadTokenUrl;
  constructor(opts: IOssProps) {
    this.uploadTokenDeferred = deferred();
    if (opts.uploadToken) {
      this.uploadToken = opts.uploadToken;
      this.uploadTokenDeferred.resolve();
    } else if (opts.getUploadTokenUrl) {
      this.uploadToken = '';
      this.getUploadToken();
    } else {
      throw new Error(
        '[oss] uploadToken must direct specify uploadToken or provide getUploadTokenUrl'
      );
    }
    this.includeDirs = opts.includeDirs || [process.cwd()];
    this.excludeKey = opts.excludeKey;
    this.getUploadTokenUrl = opts.getUploadTokenUrl;
  }

  get _putStreamDefault() {
    return {
      zone: qiniu.zone.Zone_z2,
    };
  }

  protected async getUploadToken() {
    try {
      const { data } = await request(this.getUploadTokenUrl!, {
        dataType: 'json',
      });
      if (data && data.code === 200) {
        this.uploadToken = data.data.uploadToken;
        this.uploadTokenDeferred.resolve();
      } else {
        throw new Error(`data: ${data}`);
      }
    } catch (e) {
      this.uploadTokenDeferred.reject(new Error('[oss getUploadToken] ' + e));
    }
  }

  protected getUploadTokenTimeout() {
    return timeout({
      err: new Error('[oss getUploadToken] timeout'),
      delay: 5000,
    });
  }

  protected getFormUploader(conf: qiniu.conf.ConfigOptions) {
    const config = new qiniu.conf.Config();
    Object.assign(config, conf);
    const formUploader = new qiniu.form_up.FormUploader(config);
    return formUploader;
  }

  protected async putStream(
    uploadPath: string,
    parent: string,
    formUploader: qiniu.form_up.FormUploader,
    putExtra: qiniu.form_up.PutExtra
  ) {
    const parentPath = path.join(uploadPath, parent);
    let files = await fs.readdir(parentPath);
    const fileStats = files
      .filter((file) =>
        this.excludeKey
          ? this.excludeKey.test(parent ? `${parent}/${file}` : file)
          : true
      )
      .map((file) => {
        const _path = path.join(parentPath, file);
        return {
          path: _path,
          key: parent ? `${parent}/${file}` : file,
          stat: fs.stat(_path),
        };
      });
    const curFileUploads = [];
    const curDirectoryUploads = [];
    for (let fileStat of fileStats) {
      const stat = await fileStat.stat;
      if (stat.isDirectory()) {
        curDirectoryUploads.push(
          this.putStream(uploadPath, fileStat.key, formUploader, putExtra)
        );
      } else {
        const readableStream = fs2.createReadStream(fileStat.path);
        curFileUploads.push(
          new Promise<void>((resolve, reject) => {
            formUploader.putStream(
              this.uploadToken,
              fileStat.key,
              readableStream,
              putExtra,
              function (respErr, respBody, respInfo) {
                if (respErr) {
                  return reject(respErr);
                }
                if (respInfo.statusCode == 200) {
                  console.log(respBody);
                  resolve();
                } else {
                  reject({
                    statusCode: respInfo.statusCode,
                    respBody,
                  });
                }
              }
            );
          })
        );
      }
    }
    await Promise.all(curFileUploads.concat(curDirectoryUploads));
  }

  public async uploadByStream(conf?: IPutSteamProps) {
    console.log('[oss] uploadByStream => start ...');
    await Promise.race([
      this.uploadTokenDeferred.promise,
      this.getUploadTokenTimeout(),
    ]);
    const formUploader = this.getFormUploader(
      Object.assign({}, this._putStreamDefault, conf)
    );
    const putExtra = new qiniu.form_up.PutExtra();
    await Promise.all(
      this.includeDirs.map((uploadPath) =>
        this.putStream(uploadPath, '', formUploader, putExtra)
      )
    );
    console.log('[oss] uploadByStream => end');
  }
}

export default Oss;
