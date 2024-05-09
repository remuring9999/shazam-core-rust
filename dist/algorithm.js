"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureGenerator = exports.RingBuffer = void 0;
//referenced from /rust
const fft_1 = require("./fft");
const signatures_1 = require("./signatures");
const hanning = (m) => Array(m)
    .fill(0)
    .map((_, n) => 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (m - 1)));
const pyMod = (a, b) => (a % b >= 0 ? a % b : b + (a % b));
const HANNING_MATRIX = hanning(2050).slice(1, 2049);
class RingBuffer {
    constructor(bufferSize, defaultValue) {
        this.bufferSize = bufferSize;
        this.position = 0;
        this.written = 0;
        if (typeof defaultValue === "function") {
            this.list = Array(bufferSize)
                .fill(null)
                .map(defaultValue);
        }
        else {
            this.list = Array(bufferSize).fill(defaultValue !== null && defaultValue !== void 0 ? defaultValue : null);
        }
    }
    append(value) {
        this.list[this.position] = value;
        this.position++;
        this.written++;
        this.position %= this.bufferSize;
    }
}
exports.RingBuffer = RingBuffer;
class SignatureGenerator {
    initFields() {
        this.ringBufferOfSamples = new RingBuffer(2048, 0);
        this.fftOutputs = new RingBuffer(256, () => new Float64Array(Array(1025).fill(0)));
        this.spreadFFTsOutput = new RingBuffer(256, () => new Float64Array(Array(1025).fill(0)));
        this.nextSignature = new signatures_1.DecodedMessage();
        this.nextSignature.sampleRateHz = 16000;
        this.nextSignature.numberSamples = 0;
        this.nextSignature.frequencyBandToSoundPeaks = {};
    }
    constructor() {
        this.inputPendingProcessing = [];
        this.samplesProcessed = 0;
        this.initFields();
    }
    feedInput(s16leMonoSamples) {
        this.inputPendingProcessing =
            this.inputPendingProcessing.concat(s16leMonoSamples);
    }
    getNextSignature() {
        if (this.inputPendingProcessing.length - this.samplesProcessed < 128) {
            return null;
        }
        this.processInput(this.inputPendingProcessing);
        this.samplesProcessed += this.inputPendingProcessing.length;
        const returnedSignature = this.nextSignature;
        this.initFields();
        return returnedSignature;
    }
    processInput(s16leMonoSamples) {
        this.nextSignature.numberSamples += s16leMonoSamples.length;
        for (let positionOfChunk = 0; positionOfChunk < s16leMonoSamples.length; positionOfChunk += 128) {
            this.doFFT(s16leMonoSamples.slice(positionOfChunk, positionOfChunk + 128));
            this.doPeakSpreading();
            if (this.spreadFFTsOutput.written >= 46) {
                this.doPeakRecognition();
            }
        }
    }
    doFFT(batchOf128S16leMonoSamples) {
        this.ringBufferOfSamples.list.splice(this.ringBufferOfSamples.position, batchOf128S16leMonoSamples.length, ...batchOf128S16leMonoSamples);
        this.ringBufferOfSamples.position += batchOf128S16leMonoSamples.length;
        this.ringBufferOfSamples.position %= 2048;
        this.ringBufferOfSamples.written += batchOf128S16leMonoSamples.length;
        const excerptFromRingBuffer = [
            ...this.ringBufferOfSamples.list.slice(this.ringBufferOfSamples.position),
            ...this.ringBufferOfSamples.list.slice(0, this.ringBufferOfSamples.position),
        ];
        const results = (0, fft_1.fft)(excerptFromRingBuffer.map((v, i) => new fft_1.ComplexNumber(v * HANNING_MATRIX[i], 0)))
            .map((e) => (e.imag * e.imag + e.real * e.real) / (1 << 17))
            .map((e) => (e < 0.0000000001 ? 0.0000000001 : e))
            .slice(0, 1025);
        if (results.length != 1025) {
            console.log("FFT Conversion failed.");
        }
        this.fftOutputs.append(new Float64Array(results));
    }
    doPeakSpreading() {
        const originLastFFT = this.fftOutputs.list[pyMod(this.fftOutputs.position - 1, this.fftOutputs.bufferSize)], spreadLastFFT = new Float64Array(originLastFFT);
        for (let position = 0; position < 1025; position++) {
            if (position < 1023) {
                spreadLastFFT[position] = Math.max(...spreadLastFFT.slice(position, position + 3));
            }
            let maxValue = spreadLastFFT[position];
            for (const formerFftNum of [-1, -3, -6]) {
                const formerFftOutput = this.spreadFFTsOutput.list[pyMod(this.spreadFFTsOutput.position + formerFftNum, this.spreadFFTsOutput.bufferSize)];
                if (isNaN(formerFftOutput[position]))
                    continue;
                formerFftOutput[position] = maxValue = Math.max(formerFftOutput[position], maxValue);
            }
        }
        this.spreadFFTsOutput.append(spreadLastFFT);
    }
    doPeakRecognition() {
        const fftMinus46 = this.fftOutputs.list[pyMod(this.fftOutputs.position - 46, this.fftOutputs.bufferSize)];
        const fftMinus49 = this.spreadFFTsOutput.list[pyMod(this.spreadFFTsOutput.position - 49, this.spreadFFTsOutput.bufferSize)];
        const range = (a, b, c = 1) => {
            const out = [];
            for (let i = a; i < b; i += c)
                out.push(i);
            return out;
        };
        for (let binPosition = 10; binPosition < 1015; binPosition++) {
            // 46번째 FFT의 binPosition이 1/64 이상이고, 46번째 FFT의 binPosition이 49번째 FFT의 binPosition보다 크거나 같을 때
            if (fftMinus46[binPosition] >= 1 / 64 &&
                fftMinus46[binPosition] >= fftMinus49[binPosition - 1]) {
                let maxNeighborInFftMinus49 = 0;
                for (const neighborOffset of [
                    ...range(-10, -3, 3),
                    -3,
                    1,
                    ...range(2, 9, 3),
                ]) {
                    const candidate = fftMinus49[binPosition + neighborOffset];
                    if (isNaN(candidate))
                        continue;
                    maxNeighborInFftMinus49 = Math.max(candidate, maxNeighborInFftMinus49);
                }
                if (fftMinus46[binPosition] > maxNeighborInFftMinus49) {
                    let maxNeighborInOtherAdjacentFFTs = maxNeighborInFftMinus49;
                    for (const otherOffset of [
                        -53,
                        -45,
                        ...range(165, 201, 7),
                        ...range(214, 250, 7),
                    ]) {
                        const candidate = this.spreadFFTsOutput.list[pyMod(this.spreadFFTsOutput.position + otherOffset, this.spreadFFTsOutput.bufferSize)][binPosition - 1];
                        if (isNaN(candidate))
                            continue;
                        maxNeighborInOtherAdjacentFFTs = Math.max(candidate, maxNeighborInOtherAdjacentFFTs);
                    }
                    //peak 값
                    if (fftMinus46[binPosition] > maxNeighborInOtherAdjacentFFTs) {
                        const fftNumber = this.spreadFFTsOutput.written - 46;
                        const peakMagnitude = Math.log(Math.max(1 / 64, fftMinus46[binPosition])) * 1477.3 +
                            6144, peakMagnitudeBefore = Math.log(Math.max(1 / 64, fftMinus46[binPosition - 1])) *
                            1477.3 +
                            6144, peakMagnitudeAfter = Math.log(Math.max(1 / 64, fftMinus46[binPosition + 1])) *
                            1477.3 +
                            6144;
                        const peakVariation1 = peakMagnitude * 2 - peakMagnitudeBefore - peakMagnitudeAfter, peakVariation2 = ((peakMagnitudeAfter - peakMagnitudeBefore) * 32) /
                            peakVariation1;
                        const correctedPeakFrequencyBin = binPosition * 64 + peakVariation2;
                        if (peakVariation1 <= 0) {
                            console.log("Assert 2 failed - " + peakVariation1);
                        }
                        const frequencyHz = correctedPeakFrequencyBin * (16000 / 2 / 1024 / 64);
                        let band;
                        if (frequencyHz < 250) {
                            continue;
                        }
                        else if (frequencyHz <= 520) {
                            band = signatures_1.FrequencyBand._250_520;
                        }
                        else if (frequencyHz <= 1450) {
                            band = signatures_1.FrequencyBand._520_1450;
                        }
                        else if (frequencyHz <= 3500) {
                            band = signatures_1.FrequencyBand._1450_3500;
                        }
                        else if (frequencyHz <= 5500) {
                            band = signatures_1.FrequencyBand._3500_5500;
                        }
                        else
                            continue;
                        if (!Object.keys(this.nextSignature.frequencyBandToSoundPeaks).includes(signatures_1.FrequencyBand[band])) {
                            this.nextSignature.frequencyBandToSoundPeaks[signatures_1.FrequencyBand[band]] = [];
                        }
                        this.nextSignature.frequencyBandToSoundPeaks[signatures_1.FrequencyBand[band]].push(new signatures_1.FrequencyPeak(fftNumber, Math.round(peakMagnitude), Math.round(correctedPeakFrequencyBin), 16000));
                    }
                }
            }
        }
    }
}
exports.SignatureGenerator = SignatureGenerator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxnb3JpdGhtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FsZ29yaXRobS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1QkFBdUI7QUFDdkIsK0JBQTJDO0FBQzNDLDZDQUE0RTtBQUU1RSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQzVCLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDTCxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ1AsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXRFLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFM0UsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFcEQsTUFBYSxVQUFVO0lBS3JCLFlBQW1CLFVBQWtCLEVBQUUsWUFBNEI7UUFBaEQsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUg5QixhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBQ3JCLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFHekIsSUFBSSxPQUFPLFlBQVksS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUN2QyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7aUJBQzFCLElBQUks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