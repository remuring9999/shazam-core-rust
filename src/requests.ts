export class Request {
  static headers(language: string = "ko") {
    return {
      "X-Shazam-Platform": "IPHONE",
      "X-Shazam-AppVersion": "14.1.0",
      Accept: "*/*",
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": language,
      "User-Agent": `Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile/8J2 Twitter for iPhone`,
    };
  }
}

export class Device {
  devices = ["iphone", "android", "web"];

  get random_device(): string {
    return this.devices[Math.floor(Math.random() * this.devices.length)];
  }
}
