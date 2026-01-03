
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.15 // Slightly increased default threshold for better candidate catching
): number | null {
  const bufferSize = buffer.length;
  const halfBufferSize = Math.floor(bufferSize / 2);
  const yinBuffer = new Float32Array(halfBufferSize);

  // Step 1: Difference function
  for (let tau = 0; tau < halfBufferSize; tau++) {
    for (let i = 0; i < halfBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // Step 2: Cumulative mean normalized difference function
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfBufferSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / (runningSum || 1); // Avoid division by zero
  }

  // Step 3: Absolute threshold search
  let tau = -1;
  for (let t = 1; t < halfBufferSize; t++) {
    if (yinBuffer[t] < threshold) {
      while (t + 1 < halfBufferSize && yinBuffer[t + 1] < yinBuffer[t]) {
        t++;
      }
      tau = t;
      break;
    }
  }

  // If no tau was found below threshold, look for the global minimum
  // This makes the tuner more "sensitive" to weak signals
  if (tau === -1) {
    let minVal = 1;
    for (let t = 1; t < halfBufferSize; t++) {
      if (yinBuffer[t] < minVal) {
        minVal = yinBuffer[t];
        tau = t;
      }
    }
    // Permissive noise floor (0.6) instead of 0.4 to allow weaker/noisier signals to be detected
    if (minVal > 0.6) return null;
  }

  // Step 4: Parabolic interpolation for sub-sample accuracy
  let betterTau: number;
  if (tau > 0 && tau < halfBufferSize - 1) {
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    const denominator = 2 * (2 * s1 - s2 - s0);
    if (Math.abs(denominator) > 1e-6) {
      betterTau = tau + (s2 - s0) / denominator;
    } else {
      betterTau = tau;
    }
  } else {
    betterTau = tau;
  }

  return sampleRate / betterTau;
}

export function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}
