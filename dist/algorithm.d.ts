import { DecodedMessage } from "./signatures";
export declare class RingBuffer<T> {
    bufferSize: number;
    list: (T | null)[];
    position: number;
    written: number;
    constructor(bufferSize: number, defaultValue?: T | (() => T));
    append(value: T): void;
}
export declare class SignatureGenerator {
    private inputPendingProcessing;
    private samplesProcessed;
    private ringBufferOfSamples;
    private fftOutputs;
    private spreadFFTsOutput;
    private nextSignature;
    private initFields;
    constructor();
    feedInput(s16leMonoSamples: number[]): void;
    getNextSignature(): DecodedMessage | null;
    processInput(s16leMonoSamples: number[]): void;
    doFFT(batchOf128S16leMonoSamples: number[]): void;
    doPeakSpreading(): void;
    doPeakRecognition(): void;
}
