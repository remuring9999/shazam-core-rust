"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shazam = exports.Endpoint = void 0;
const algorithm_1 = require("./algorithm");
const shazamio_core_1 = require("shazamio-core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = require("fs");
const requests_1 = require("./requests");
const TIME_ZONE = "Asia/Seoul";
function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    })
        .toUpperCase();
}
class Endpoint {
    constructor(timezone) {
        this.timezone = timezone;
    }
    url() {
        return `${Endpoint.SCHEME}://${Endpoint.HOSTNAME}/discovery/v5/ko/KR/iphone/-/tag/${uuidv4()}/${uuidv4()}`;
    }
    params() {
        return {
            sync: "true",
            webv3: "true",
            sampling: "true",
            connected: "",
            shazamapiversion: "v3",
            sharehub: "true",
            hubv5minorversion: "v5.1",
            hidelb: "true",
            video: "v3",
        };
    }
    headers(language = "en") {
        return requests_1.Request.headers(language);
    }
    async sendRecognizeRequest(url, body) {
        return await (await (0, node_fetch_1.default)(url, {
            body,
            headers: this.headers("ko"),
            method: "POST",
        })).json();
    }
    async formatAndSendRecognizeRequest(signature) {
        const data = {
            timezone: this.timezone,
            signature: {
                uri: signature.encodeToUri(),
                samplems: Math.round((signature.numberSamples / signature.sampleRateHz) * 1000),
            },
            timestamp: new Date().getTime(),
            context: {},
            geolocation: {},
        };
        const url = new URL(this.url());
        Object.entries(this.params()).forEach(([a, b]) => url.searchParams.append(a, b));
        const response = await this.sendRecognizeRequest(url.toString(), JSON.stringify(data));
        if ((response === null || response === void 0 ? void 0 : response.matches.length) === 0)
            return null;
        return response;
    }
}
exports.Endpoint = Endpoint;
Endpoint.SCHEME = "https";
Endpoint.HOSTNAME = "amp.shazam.com";
/**
 * @class Shazam
 */
class Shazam {
    constructor(timeZone) {
        this.endpoint = new Endpoint(timeZone !== null && timeZone !== void 0 ? timeZone : TIME_ZONE);
    }
    headers() {
        return requests_1.Request.headers("ko");
    }
    async recognise(path) {
        const signatures = (0, shazamio_core_1.recognizeBytes)((0, fs_1.readFileSync)(path), 0, Number.MAX_SAFE_INTEGER);
        let response;
        //signature 찾기
        for (let i = Math.floor(signatures.length / 2); i < signatures.length; i += 4) {
            const data = {
                timezone: this.endpoint.timezone,
                signature: {
                    uri: signatures[i].uri,
                    samplems: signatures[i].samplems,
                },
                timestamp: new Date().getTime(),
                context: {},
                geolocation: {},
            };
            const url = new URL(this.endpoint.url());
            Object.entries(this.endpoint.params()).forEach(([a, b]) => url.searchParams.append(a, b));
            response = await this.endpoint.sendRecognizeRequest(url.toString(), JSON.stringify(data));
            if ((response === null || response === void 0 ? void 0 : response.matches.length) === 0)
                continue;
            break;
        }
        for (const sig of signatures)
            sig.free();
        if (!response)
            return null;
        if ((response === null || response === void 0 ? void 0 : response.matches.length) === 0)
            return null;
        return response;
    }
    createSignatureGenerator(samples) {
        const signatureGenerator = new algorithm_1.SignatureGenerator();
        signatureGenerator.feedInput(samples);
        return signatureGenerator;
    }
}
exports.Shazam = Shazam;
Shazam.MAX_TIME_SCEONDS = 8;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyQ0FBaUQ7QUFFakQsaURBQStDO0FBQy9DLDREQUE4QztBQUU5QywyQkFBa0M7QUFDbEMseUNBQXFDO0FBQ3JDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQztBQUUvQixTQUFTLE1BQU07SUFDYixPQUFPLHNDQUFzQztTQUMxQyxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQztRQUMzQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQ2hDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNyQyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDO1NBQ0QsV0FBVyxFQUFFLENBQUM7QUFDbkIsQ0FBQztBQUVELE1BQWEsUUFBUTtJQUluQixZQUFtQixRQUFnQjtRQUFoQixhQUFRLEdBQVIsUUFBUSxDQUFRO0lBQUcsQ0FBQztJQUN2QyxHQUFHO1FBQ0QsT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLE1BQ3ZCLFFBQVEsQ0FBQyxRQUNYLG9DQUFvQyxNQUFNLEVBQUUsSUFBSSxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQzdELENBQUM7SUFDRCxNQUFNO1FBQ0osT0FBTztZQUNMLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLE1BQU07WUFDYixRQUFRLEVBQUUsTUFBTTtZQUNoQixTQUFTLEVBQUUsRUFBRTtZQUNiLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsUUFBUSxFQUFFLE1BQU07WUFDaEIsaUJBQWlCLEVBQUUsTUFBTTtZQUN6QixNQUFNLEVB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