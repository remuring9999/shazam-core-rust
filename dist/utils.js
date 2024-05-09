"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s16LEToSamplesArray = void 0;
//samples s16e 변환
//ffmpeg 해쉬 todo
function s16LEToSamplesArray(rawSamples) {
    const samplesArray = [];
    for (let i = 0; i < rawSamples.length / 2; i++) {
        let sample = rawSamples[2 * i] | (rawSamples[2 * i + 1] << 8);
        if (sample & 0x8000) {
            sample = (sample & 0x7fff) - 0x8000;
        }
        samplesArray.push(sample);
    }
    return samplesArray;
}
exports.s16LEToSamplesArray = s16LEToSamplesArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUJBQWlCO0FBQ2pCLGdCQUFnQjtBQUNoQixTQUFnQixtQkFBbUIsQ0FBQyxVQUFzQjtJQUN4RCxNQUFNLFlBQVksR0FBYSxFQUFFLENBQUM7SUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDL0MsSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELElBQUksTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLE1BQU0sR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUM7UUFDdEMsQ0FBQztRQUNELFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFWRCxrREFVQyJ9