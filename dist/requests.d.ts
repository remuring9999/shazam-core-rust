export declare class Request {
    static headers(language?: string): {
        "X-Shazam-Platform": string;
        "X-Shazam-AppVersion": string;
        Accept: string;
        "Content-Type": string;
        "Accept-Encoding": string;
        "Accept-Language": string;
        "User-Agent": string;
    };
}
export declare class Device {
    devices: string[];
    get random_device(): string;
}
