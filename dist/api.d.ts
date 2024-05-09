import { SignatureGenerator } from "./algorithm";
import { DecodedMessage } from "./signatures";
import { ShazamRoot } from "./types/shazam";
export declare class Endpoint {
    timezone: string;
    static SCHEME: string;
    static HOSTNAME: string;
    constructor(timezone: string);
    url(): string;
    params(): {
        sync: string;
        webv3: string;
        sampling: string;
        connected: string;
        shazamapiversion: string;
        sharehub: string;
        hubv5minorversion: string;
        hidelb: string;
        video: string;
    };
    headers(language?: string): {
        "X-Shazam-Platform": string;
        "X-Shazam-AppVersion": string;
        Accept: string;
        "Content-Type": string;
        "Accept-Encoding": string;
        "Accept-Language": string;
        "User-Agent": string;
    };
    sendRecognizeRequest(url: string, body: string): Promise<ShazamRoot | null>;
    formatAndSendRecognizeRequest(signature: DecodedMessage): Promise<ShazamRoot | null>;
}
/**
 * @class Shazam
 */
export declare class Shazam {
    static MAX_TIME_SCEONDS: number;
    endpoint: Endpoint;
    constructor(timeZone?: string);
    headers(): {
        "X-Shazam-Platform": string;
        "X-Shazam-AppVersion": string;
        Accept: string;
        "Content-Type": string;
        "Accept-Encoding": string;
        "Accept-Language": string;
        "User-Agent": string;
    };
    recognise(path: string): Promise<ShazamRoot | null>;
    createSignatureGenerator(samples: number[]): SignatureGenerator;
}
