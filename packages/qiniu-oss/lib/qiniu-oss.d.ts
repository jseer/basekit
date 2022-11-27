import qiniu from 'qiniu';
interface IOssProps {
    uploadToken?: string;
    getUploadTokenUrl?: string;
    includeDirs?: string[];
    excludeKey?: RegExp;
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
    get _putStreamDefault(): {
        zone: qiniu.conf.Zone;
    };
    protected getUploadToken(): Promise<void>;
    protected getUploadTokenTimeout(): Promise<unknown>;
    protected getFormUploader(conf: qiniu.conf.ConfigOptions): qiniu.form_up.FormUploader;
    protected putStream(uploadPath: string, parent: string, formUploader: qiniu.form_up.FormUploader, putExtra: qiniu.form_up.PutExtra): Promise<void>;
    uploadByStream(conf?: IPutSteamProps): Promise<void>;
}
export default Oss;
