declare const timeout: ({ delay, err, }?: {
    delay?: number | undefined;
    err?: any;
}) => Promise<unknown>;
export default timeout;
