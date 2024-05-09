import { SignatureGenerator } from "./algorithm";
import { DecodedMessage } from "./signatures";
import { recognizeBytes } from "shazamio-core";
import { default as fetch } from "node-fetch";
import { ShazamRoot } from "./types/shazam";
import { readFileSync } from "fs";
import { Request } from "./requests";
const TIME_ZONE = "Asia/Seoul";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
}

export class Endpoint {
  static SCHEME = "https";
  static HOSTNAME = "amp.shazam.com";

  constructor(public timezone: string) {}
  url() {
    return `${Endpoint.SCHEME}://${
      Endpoint.HOSTNAME
    }/discovery/v5/ko/KR/iphone/-/tag/${uuidv4()}/${uuidv4()}`;
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
  headers(language: string = "en") {
    return Request.headers(language);
  }

  async sendRecognizeRequest(
    url: string,
    body: string
  ): Promise<ShazamRoot | null> {
    return await (
      await fetch(url, {
        body,
        headers: this.headers("ko"),
        method: "POST",
      })
    ).json();
  }

  async formatAndSendRecognizeRequest(
    signature: DecodedMessage
  ): Promise<ShazamRoot | null> {
    const data = {
      timezone: this.timezone,
      signature: {
        uri: signature.encodeToUri(),
        samplems: Math.round(
          (signature.numberSamples / signature.sampleRateHz) * 1000
        ),
      },
      timestamp: new Date().getTime(),
      context: {},
      geolocation: {},
    };
    const url = new URL(this.url());
    Object.entries(this.params()).forEach(([a, b]) =>
      url.searchParams.append(a, b)
    );

    const response = await this.sendRecognizeRequest(
      url.toString(),
      JSON.stringify(data)
    );
    if (response?.matches.length === 0) return null;

    return response as ShazamRoot;
  }
}
/**
 * @class Shazam
 */
export class Shazam {
  static MAX_TIME_SCEONDS = 8;

  public endpoint: Endpoint;
  constructor(timeZone?: string) {
    this.endpoint = new Endpoint(timeZone ?? TIME_ZONE);
  }

  headers() {
    return Request.headers("ko");
  }

  async recognise(path: string) {
    const signatures = recognizeBytes(
      readFileSync(path),
      0,
      Number.MAX_SAFE_INTEGER
    );
    let response;

    //signature 찾기
    for (
      let i = Math.floor(signatures.length / 2);
      i < signatures.length;
      i += 4
    ) {
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

      Object.entries(this.endpoint.params()).forEach(([a, b]) =>
        url.searchParams.append(a, b)
      );

      response = await this.endpoint.sendRecognizeRequest(
        url.toString(),
        JSON.stringify(data)
      );

      if (response?.matches.length === 0) continue;
      break;
    }

    for (const sig of signatures) sig.free();

    if (!response) return null;
    if (response?.matches.length === 0) return null;

    return response;
  }

  createSignatureGenerator(samples: number[]) {
    const signatureGenerator = new SignatureGenerator();
    signatureGenerator.feedInput(samples);
    return signatureGenerator;
  }
}
