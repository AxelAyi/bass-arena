
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface NoteInfo {
  frequency: number;
  midi: number;
  noteName: string;
  octave: number;
  cents: number;
}

export function frequencyToNote(freq: number): NoteInfo {
  const midi = 12 * (Math.log2(freq / 440)) + 69;
  const roundedMidi = Math.round(midi);
  const cents = Math.floor((midi - roundedMidi) * 100);
  const noteName = NOTE_NAMES[roundedMidi % 12];
  const octave = Math.floor(roundedMidi / 12) - 1;

  return {
    frequency: freq,
    midi: roundedMidi,
    noteName,
    octave,
    cents
  };
}

export function getMidiForNote(noteName: string, octave: number): number {
  const nameIndex = NOTE_NAMES.indexOf(noteName);
  if (nameIndex === -1) return -1;
  return (octave + 1) * 12 + nameIndex;
}

/**
 * Validates if a detected note matches the target, considering octave settings.
 */
export function validateNote(
  detectedMidi: number, 
  targetMidi: number, 
  strictOctave: boolean
): boolean {
  if (strictOctave) {
    return detectedMidi === targetMidi;
  } else {
    return (detectedMidi % 12) === (targetMidi % 12);
  }
}
