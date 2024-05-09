export declare enum FrequencyBand {
    _0_250 = -1,
    _250_520 = 0,
    _520_1450 = 1,
    _1450_3500 = 2,
    _3500_5500 = 3
}
export declare enum SampleRate {
    _8000 = 1,
    _11025 = 2,
    _16000 = 3,
    _32000 = 4,
    _44100 = 5,
    _48000 = 6
}
export declare class FrequencyPeak {
    fftPassNumber: number;
    peakMagnitude: number;
    correctedPeakFrequencyBin: number;
    sampleRateHz: number;
    constructor(fftPassNumber: number, peakMagnitude: number, correctedPeakFrequencyBin: number, sampleRateHz: number);
    getFrequencyHz(): number;
    getAmplitudePcm(): number;
    getSeconds(): number;
}
export interface RawSignatureHeader {
    magic1: number;
    crc32: number;
    sizeMinusHeader: number;
    magic2: number;
    shiftedSampleRateId: number;
    numberSamplesPlusDividedSampleRate: number;
    fixedValue: number;
}
export declare function readRawSignatureHeader(read: (e?: number) => Uint8Array): {
    magic1: number;
    crc32: number;
    sizeMinusHeader: number;
    magic2: number;
    shiftedSampleRateId: number;
    numberSamplesPlusDividedSampleRate: number;
    fixedValue: number;
};
export declare function writeRawSignatureHeader(rsh: RawSignatureHeader): Uint8Array;
export declare class DecodedMessage {
    uri: boolean;
    sampleRateHz: number;
    numberSamples: number;
    frequencyBandToSoundPeaks: {
        [key: string]: FrequencyPeak[];
    };
    static decodeFromBinary(bytes: Uint8Array): DecodedMessage;
    static decodeFromUri(uri: string): DecodedMessage;
    encodeToBinary(): number[];
    encodeToUri(): string;
}
