import qiniu from 'qiniu';
interface IOssProps {
    uploadToken?: string;
    getUploadTokenUrl?: string;
    includeDirs?: string[];
    excludeKey?: RegExp;
}
interface IEmptyResult {
    dir: string;
    allCount: number;
    successCount: number;
    success: object[];
    failCount: number;
    fail: object[];
}
export interface IPutSteamProps {
    zone?: qiniu.conf.Zone;
}
declare class Oss implements IOssProps {
    private uploadTokenDeferred;
    uploadToken: string;
    includeDirs: string[];
    excludeKey: RegExp | undefined;
    getUploadTokenUrl: string | undefined;
    constructor(opts: IOssProps);
    private get _putStreamDefault();
    protected getUploadToken(): Promise<void>;
    protected getUploadTokenTimeout(): Promise<unknown>;
    protected getFormUploader(conf: qiniu.conf.ConfigOptions): qiniu.form_up.FormUploader;
    private createEmptyResultByDir;
    protected putStream(uploadPath: string, parent: string, formUploader: qiniu.form_up.FormUploader, putExtra: qiniu.form_up.PutExtra, result: IEmptyResult): Promise<void>;
    uploadByStream(conf?: IPutSteamProps): Promise<void>;
}
export default Oss;
