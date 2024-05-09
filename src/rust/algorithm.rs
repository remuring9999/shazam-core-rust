// algorithm.rs
use crate::ffmpeg_wrapper::{decode_with_ffmpeg, decode_with_ffmpeg_from_bytes};
use crate::hanning::HANNING_WINDOW_2048_MULTIPLIERS;
use crate::signature_format::{DecodedSignature, FrequencyBand, FrequencyPeak};

use chfft::RFft1D;
use std::collections::HashMap;
use std::error::Error;
use std::io::{BufReader, Cursor};
//변수 선언

/*
구조체 선언블럭
TODO : (Typescript Interface 고려)
 */
pub struct SignatureGenerator {
    ring_buffer_of_samples: Vec<i16>,
    reordered_ring_buffer_of_samples: Vec<f32>,
    fft_outputs: Vec<Vec<f32>>,
    spread_fft_outputs: Vec<Vec<f32>>,
    ring_buffer_of_samples_index: usize,
    fft_outputs_index: usize,
    fft_object: RFft1D<f32>,
    spread_fft_outputs_index: usize,
    num_spread_ffts_done: u32,
    signature: DecodedSignature,
}

impl SignatureGenerator {
    // 서명생성
    pub fn make_signature_from_bytes(bytes: Vec<u8>) -> Result<DecodedSignature, Box<dyn Error>> {
        let cursor = Cursor::new(bytes.clone());

        let decoder = rodio::Decoder::new(cursor)
            .or_else(|_decoding_error| decode_with_ffmpeg_from_bytes(&bytes))?; // ffmpeg, rodio 둘다 안되면 에러

        //PCM 샘플로 변환 (16KHz로 다운샘플링)
        let converted_file = rodio::source::UniformSourceIterator::new(decoder, 1, 16000);
        let raw_pcm_samples: Vec<i16> = converted_file.collect();

        // 12초까지만 샘플링
        let slice_len = raw_pcm_samples.len().min(12 * 16000);
        let mut raw_pcm_samples_slice = &raw_pcm_samples[..slice_len];

        // 12초 이상이면 중간 12초만 샘플링
        if raw_pcm_samples_slice.len() > 12 * 16000 {
            let middle = raw_pcm_samples.len() / 2;
            raw_pcm_samples_slice =
                &raw_pcm_samples_slice[middle - (6 * 16000)..middle + (6 * 16000)];
        }

        let signature =
            SignatureGenerator::make_signature_from_buffer(raw_pcm_samples_slice.to_vec());

        Ok(signature)
    }
    pub fn make_signature_from_file(file_path: &str) -> Result<DecodedSignature, Box<dyn Error>> {
        // 미디어 파일 디코딩
        let mut decoder = rodio::Decoder::new(BufReader::new(std::fs::File::open(file_path)?));

        // ffmpeg로 디코딩
        if let Err(ref _decoding_error) = decoder {
            if let Some(new_decoder) = decode_with_ffmpeg(file_path) {
                decoder = Ok(new_decoder);
            }
        }

        let converted_file = rodio::source::UniformSourceIterator::new(decoder?, 1, 16000); // 16KHz로 다운샘플링
        let raw_pcm_samples: Vec<i16> = converted_file.collect(); // PCM 샘플로 변환
        let mut raw_pcm_samples_slice: &[i16] = &raw_pcm_samples; // 12초까지만 샘플링
        let slice_len = raw_pcm_samples_slice.len().min(12 * 16000); // 12초 이상이면 중간 12초만 샘플링

        if raw_pcm_samples_slice.len() > 12 * 16000 {
            let middle = raw_pcm_samples.len() / 2;
            raw_pcm_samples_slice =
                &raw_pcm_samples_slice[middle - (6 * 16000)..middle + (6 * 16000)];
        }

        // println!("PRE BUF");
        // println!("{} len slice", slice_len);
        // println!("{} len slice 2", raw_pcm_samples_slice.len());

        // println!("{:?}",raw_pcm_samples_slice[..slice_len]);

        let b = &raw_pcm_samples_slice[..slice_len]; // TODO
        let res = SignatureGenerator::make_signature_from_buffer(b.to_vec()); // 벡터로 변환
        Ok(res)
    }

    pub fn make_signature_from_buffer(s16_mono_16khz_buffer: Vec<i16>) -> DecodedSignature {
        let mut this = SignatureGenerator {
            ring_buffer_of_samples: vec![0i16; 2048],
            ring_buffer_of_samples_index: 0,

            reordered_ring_buffer_of_samples: vec![0.0f32; 2048],

            fft_outputs: vec![vec![0.0f32; 1025]; 256],
            fft_outputs_index: 0,

            fft_object: RFft1D::new(2048),

            spread_fft_outputs: vec![vec![0.0f32; 1025]; 256],
            spread_fft_outputs_index: 0,

            num_spread_ffts_done: 0,

            signature: DecodedSignature {
                sample_rate_hz: 16000,
                number_samples: s16_mono_16khz_buffer.len() as u32,
                frequency_band_to_sound_peaks: HashMap::new(),
            },
        };
        for chunk in s16_mono_16khz_buffer.chunks_exact(128) {
            this.do_fft(chunk);

            this.do_peak_spreading();

            this.num_spread_ffts_done += 1;

            if this.num_spread_ffts_done >= 46 {
                this.do_peak_recognition();
            }
        }

        this.signature
    }

    fn do_fft(&mut self, s16_mono_16khz_buffer: &[i16]) {
        // Copy the 128 input s16le samples to the local ring buffer

        self.ring_buffer_of_samples
            [self.ring_buffer_of_samples_index..self.ring_buffer_of_samples_index + 128]
            .copy_from_slice(s16_mono_16khz_buffer);

        self.ring_buffer_of_samples_index += 128;
        self.ring_buffer_of_samples_index &= 2047;

        // Reorder the items (put the latest data at end) and apply Hanning window

        for (index, _) in HANNING_WINDOW_2048_MULTIPLIERS.iter().enumerate() {
            self.reordered_ring_buffer_of_samples[index] = self.ring_buffer_of_samples
                [(index + self.ring_buffer_of_samples_index) & 2047]
                as f32
                * HANNING_WINDOW_2048_MULTIPLIERS[index];
        }

        // Perform Fast Fourier transform
        let reordered_slice: &[f32] = self.reordered_ring_buffer_of_samples.as_ref();

        let complex_fft_results = self.fft_object.forward(reordered_slice);

        assert_eq!(complex_fft_results.len(), 1025);

        // Turn complex into reals, and put the results into a local array

        let real_fft_results = &mut self.fft_outputs[self.fft_outputs_index];

        for index in 0..=1024 {
            real_fft_results[index] = ((complex_fft_results[index].re.powi(2)
                + complex_fft_results[index].im.powi(2))
                / ((1 << 17) as f32))
                .max(0.0000000001);
        }

        self.fft_outputs_index += 1;
        self.fft_outputs_index &= 255;
    }

    fn do_peak_spreading(&mut self) {
        let real_fft_results =
            &self.fft_outputs[((self.fft_outputs_index as i32 - 1) & 255) as usize];

        let spread_fft_results = &mut self.spread_fft_outputs[self.spread_fft_outputs_index];

        // Perform frequency-domain spreading of peak values
        spread_fft_results.copy_from_slice(real_fft_results);

        for position in 0..=1022 {
            spread_fft_results[position] = spread_fft_results[position]
                .max(spread_fft_results[position + 1])
                .max(spread_fft_results[position + 2]);
        }

        // Сначала скопируем данные, чтобы избежать одновременной мутации.
        let spread_fft_results_copy = spread_fft_results.clone();

        // Теперь, используя копию, мы можем обновить исходные данные без конфликта мутации.
        for position in 0..=1024 {
            for former_fft_number in &[1, 3, 6] {
                let former_fft_output = &mut self.spread_fft_outputs
                    [((self.spread_fft_outputs_index as i32 - *former_fft_number) & 255) as usize];

                former_fft_output[position] =
                    former_fft_output[position].max(spread_fft_results_copy[position]);
            }
        }

        self.spread_fft_outputs_index += 1;
        self.spread_fft_outputs_index &= 255;
    }

    fn do_peak_recognition(&mut self) {
        // Note: when substracting an array index, casting to signed is needed
        // to avoid underflow panics at runtime.

        let fft_minus_46 = &self.fft_outputs[((self.fft_outputs_index as i32 - 46) & 255) as usize];
        let fft_minus_49 =
            &self.spread_fft_outputs[((self.spread_fft_outputs_index as i32 - 49) & 255) as usize];

        for bin_position in 10..=1014 {
            // Ensure that the bin is large enough to be a peak

            if fft_minus_46[bin_position] >= 1.0 / 64.0
                && fft_minus_46[bin_position] >= fft_minus_49[bin_position - 1]
            {
                // Ensure that it is frequency-domain local minimum

                let mut max_neighbor_in_fft_minus_49: f32 = 0.0;

                for neighbor_offset in &[-10, -7, -4, -3, 1, 2, 5, 8] {
                    max_neighbor_in_fft_minus_49 = max_neighbor_in_fft_minus_49
                        .max(fft_minus_49[(bin_position as i32 + *neighbor_offset) as usize]);
                }

                if fft_minus_46[bin_position] > max_neighbor_in_fft_minus_49 {
                    // Ensure that it is a time-domain local minimum

                    let mut max_neighbor_in_other_adjacent_ffts = max_neighbor_in_fft_minus_49;

                    for other_offset in &[
                        -53, -45, 165, 172, 179, 186, 193, 200, 214, 221, 228, 235, 242, 249,
                    ] {
                        let other_fft = &self.spread_fft_outputs[((self.spread_fft_outputs_index
                            as i32
                            + other_offset)
                            & 255)
                            as usize];

                        max_neighbor_in_other_adjacent_ffts =
                            max_neighbor_in_other_adjacent_ffts.max(other_fft[bin_position - 1]);
                    }

                    if fft_minus_46[bin_position] > max_neighbor_in_other_adjacent_ffts {
                        // This is a peak, store the peak

                        let fft_pass_number = self.num_spread_ffts_done - 46;

                        let peak_magnitude: f32 =
                            fft_minus_46[bin_position].ln().max(1.0 / 64.0) * 1477.3 + 6144.0;
                        let peak_magnitude_before: f32 =
                            fft_minus_46[bin_position - 1].ln().max(1.0 / 64.0) * 1477.3 + 6144.0;
                        let peak_magnitude_after: f32 =
                            fft_minus_46[bin_position + 1].ln().max(1.0 / 64.0) * 1477.3 + 6144.0;

                        let peak_variation_1: f32 =
                            peak_magnitude * 2.0 - peak_magnitude_before - peak_magnitude_after;
                        let peak_variation_2: f32 = (peak_magnitude_after - peak_magnitude_before)
                            * 32.0
                            / peak_variation_1;

                        let corrected_peak_frequency_bin: u16 =
                            bin_position as u16 * 64 + peak_variation_2 as u16;

                        assert!(peak_variation_1 >= 0.0);

                        // Convert back a FFT bin to a frequency, given a 16 KHz sample
                        // rate, 1024 useful bins and the multiplication by 64 made before
                        // storing the information

                        let frequency_hz: f32 =
                            corrected_peak_frequency_bin as f32 * (16000.0 / 2.0 / 1024.0 / 64.0);

                        // Ignore peaks outside the 250 Hz-5.5 KHz range, store them into
                        // a lookup table that will be used to generate the binary fingerprint
                        // otherwise

                        let frequency_band = match frequency_hz as i32 {
                            250..=519 => FrequencyBand::_250_520,
                            520..=1449 => FrequencyBand::_520_1450,
                            1450..=3499 => FrequencyBand::_1450_3500,
                            3500..=5500 => FrequencyBand::_3500_5500,
                            _ => {
                                continue;
                            }
                        };

                        self.signature
                            .frequency_band_to_sound_peaks
                            .entry(frequency_band)
                            .or_default();

                        self.signature
                            .frequency_band_to_sound_peaks
                            .get_mut(&frequency_band)
                            .unwrap()
                            .push(FrequencyPeak {
                                fft_pass_number,
                                peak_magnitude: peak_magnitude as u16,
                                corrected_peak_frequency_bin,
                                sample_rate_hz: 16000,
                            });
                    }
                }
            }
        }
    }
}
