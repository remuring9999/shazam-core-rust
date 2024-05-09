"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = exports.Request = void 0;
class Request {
    static headers(language = "ko") {
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
exports.Request = Request;
class Device {
    constructor() {
        this.devices = ["iphone", "android", "web"];
    }
    get random_device() {
        return this.devices[Math.floor(Math.random() * this.devices.length)];
    }
}
exports.Device = Device;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVxdWVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBYSxPQUFPO0lBQ2xCLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBbUIsSUFBSTtRQUNwQyxPQUFPO1lBQ0wsbUJBQW1CLEVBQUUsUUFBUTtZQUM3QixxQkFBcUIsRUFBRSxRQUFRO1lBQy9CLE1BQU0sRUFBRSxLQUFLO1lBQ2IsY0FBYyxFQUFFLGtCQUFrQjtZQUNsQyxpQkFBaUIsRUFBRSxlQUFlO1lBQ2xDLGlCQUFpQixFQUFFLFFBQVE7WUFDM0IsWUFBWSxFQUFFLDBJQUEwSTtTQUN6SixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBWkQsMEJBWUM7QUFFRCxNQUFhLE1BQU07SUFBbkI7UUFDRSxZQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBS3pDLENBQUM7SUFIQyxJQUFJLGFBQWE7UUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7Q0FDRjtBQU5ELHdCQU1DIn0=