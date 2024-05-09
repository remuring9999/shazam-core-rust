"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertfile = void 0;
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const { path } = ffmpeg_1.default;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
fluent_ffmpeg_1.default.setFfmpegPath(path);
//pcm 변환
async function convertfile(path) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(path)
            .outputFormat("s16le")
            .audioFrequency(16000)
            .outputOptions("-acodec pcm_s16le")
            .audioChannels(1)
            .duration(10)
            .output("node_shazam_temp.pcm")
            .on("end", () => {
            try {
                resolve(undefined);
            }
            catch (error) {
                reject(error);
            }
        })
            .on("error", reject)
            .run();
    });
}
exports.convertfile = convertfile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9fcGNtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RvX3BjbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzRUFBMkM7QUFDM0MsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLGdCQUFHLENBQUM7QUFDckIsa0VBQW1DO0FBRW5DLHVCQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNCLFFBQVE7QUFDRCxLQUFLLFVBQVUsV0FBVyxDQUFDLElBQVk7SUFDNUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxJQUFBLHVCQUFNLEVBQUMsSUFBSSxDQUFDO2FBQ1QsWUFBWSxDQUFDLE9BQU8sQ0FBQzthQUNyQixjQUFjLENBQUMsS0FBSyxDQUFDO2FBQ3JCLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQzthQUNsQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2FBQ2hCLFFBQVEsQ0FBQyxFQUFFLENBQUM7YUFDWixNQUFNLENBQUMsc0JBQXNCLENBQUM7YUFDOUIsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7WUFDZCxJQUFJLENBQUM7Z0JBQ0gsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQixDQUFDO1FBQ0gsQ0FBQyxDQUFDO2FBQ0QsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7YUFDbkIsR0FBRyxFQUFFLENBQUM7SUFDWCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFuQkQsa0NBbUJDIn0=